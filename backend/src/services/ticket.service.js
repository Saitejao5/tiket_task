const mongoose = require('mongoose');
const fs = require('fs'), path = require('path');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const User = require('../models/User');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const sla = require('./sla.service');
const audit = require('./audit.service');
const notif = require('./notification.service');
const { getSettings } = require('./settings.service');
const { nextTicketNumber } = require('../utils/ticketNumber');
const { parsePage, meta } = require('../utils/pagination');
const env = require('../config/env');

const isStaff = (u) => ['staff', 'manager', 'admin'].includes(u.role);
const isMgr = (u) => ['manager', 'admin'].includes(u.role);
const TRANSITIONS = { Open: ['Assigned', 'In Progress'], Assigned: ['In Progress', 'Pending'], 'In Progress': ['Pending', 'Resolved'], Pending: ['In Progress', 'Resolved'], Resolved: ['Closed', 'Reopened'], Closed: ['Reopened'], Reopened: ['In Progress'] };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const idOf = (x) => String((x && x._id) || x || '');

function scope(u) {
  if (u.role === 'student') return { student: u._id };
  if (u.role === 'admin') return {};
  if (u.role === 'manager') return u.department ? { department: u.department } : {};
  return u.department ? { $or: [{ assignedTo: u._id }, { department: u.department }] } : { assignedTo: u._id };
}
async function findAccessible(user, id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, 'Ticket not found');
  const t = await Ticket.findOne({ _id: id, ...scope(user) });
  if (!t) throw new AppError(404, 'Ticket not found');
  return t;
}
function caps(u, t, st) {
  const staff = isStaff(u), mgr = isMgr(u), own = idOf(t.assignedTo) === String(u._id);
  const winOk = t.closedAt && (Date.now() - t.closedAt) <= st.reopenWindowDays * 864e5;
  return {
    reply: t.status !== 'Closed', internalNote: staff,
    changeStatus: staff,
    changePriority: staff && (mgr || own),
    assign: mgr && t.status !== 'Closed',
    close: t.status === 'Resolved' && (staff || idOf(t.student) === String(u._id)),
    reopen: t.status === 'Resolved' || (t.status === 'Closed' && (staff || !!winOk)),
    edit: staff || (t.status === 'Open' && idOf(t.student) === String(u._id)),
    delete: u.role === 'admin',
  };
}
function present(t, user, st) {
  const o = t.toObject ? t.toObject() : t;
  o.ageHours = Math.round(((o.resolvedAt || new Date()) - o.createdAt) / 36e5 * 10) / 10;
  o.slaStatus = sla.computeStatus(o, st.dueSoonPercent);
  o.assignedInactive = !!(o.assignedTo && o.assignedTo.active === false);
  o.allowedTransitions = isStaff(user) ? (TRANSITIONS[o.status] || []) : [];
  o.capabilities = caps(user, o, st);
  if (user.role === 'student' && o.assignedTo) o.assignedTo = { _id: o.assignedTo._id, name: o.assignedTo.name };
  return o;
}
const POP_LIST = [{ path: 'student', select: 'name studentId' }, { path: 'category', select: 'name' }, { path: 'department', select: 'name code' }, { path: 'assignedTo', select: 'name active' }];
const POP_FULL = [{ path: 'student', select: 'name email studentId course year section department', populate: { path: 'department', select: 'name code' } }, { path: 'category', select: 'name subcategories' }, { path: 'department', select: 'name code' }, { path: 'assignedTo', select: 'name email active department' }];

async function create(user, body, files = []) {
  if (user.role !== 'student') throw new AppError(403, 'Only students can create tickets');
  const category = await Category.findById(body.category);
  if (!category || !category.active) throw new AppError(422, 'Selected category is not available');
  if (body.subcategory && category.subcategories.length && !category.subcategories.includes(body.subcategory)) throw new AppError(422, 'Invalid subcategory for this category');
  const st = await getSettings();
  const dup = await Ticket.findOne({ student: user._id, subject: body.subject, description: body.description, createdAt: { $gt: new Date(Date.now() - 60000) } });
  if (dup) return present(await dup.populate(POP_FULL), user, st);
  let priority = category.defaultPriority || 'Medium', requestedUrgent = false;
  if (body.priority === 'Urgent') { priority = 'High'; requestedUrgent = true; } // final priority decided by staff/manager
  const now = new Date();
  const policy = await sla.policyFor(priority, category);
  const t = await Ticket.create({ ticketNumber: await nextTicketNumber(), student: user._id, department: category.department || user.department || null, category: category._id, subcategory: body.subcategory, subject: body.subject, description: body.description, priority, requestedUrgent, createdAt: now, lastActivityAt: now, ...sla.deadlines(now, policy) });
  await audit.log({ ticket: t._id, actor: user, action: 'TICKET_CREATED', newValue: { status: 'Open', priority }, metadata: { requestedUrgent } });
  await notif.notify(user._id, { type: 'TICKET_CREATED', title: 'Request submitted', message: `${t.ticketNumber} has been created.`, ticket: t._id });
  await notif.notify(await notif.managersOf(t.department), { type: 'UNASSIGNED_TICKET', title: 'New unassigned ticket', message: `${t.ticketNumber}: ${t.subject}`, ticket: t._id });
  if (files.length) await addMessage(user, t._id, { type: 'Public Reply', content: 'Attachments submitted with the request' }, files, { silent: true });
  return present(await Ticket.findById(t._id).populate(POP_FULL), user, st);
}

async function list(user, q) {
  const { page, limit, skip } = parsePage(q); const and = [scope(user)]; const H = 36e5, now = Date.now(); const ago = (h) => new Date(now - h * H);
  for (const k of ['status', 'priority', 'slaStatus']) if (q[k]) and.push({ [k]: q[k] });
  for (const k of ['category', 'department']) if (q[k] && mongoose.isValidObjectId(q[k])) and.push({ [k]: q[k] });
  if (q.assignedTo === 'unassigned') and.push({ assignedTo: null });
  else if (q.assignedTo === 'inactive') and.push({ assignedTo: { $in: (await User.find({ active: false }).select('_id')).map((u) => u._id) } });
  else if (q.assignedTo && mongoose.isValidObjectId(q.assignedTo)) and.push({ assignedTo: q.assignedTo });
  if (q.from || q.to) { const r = {}; if (q.from) r.$gte = new Date(q.from); if (q.to) r.$lte = new Date(new Date(q.to).setHours(23, 59, 59, 999)); and.push({ createdAt: r }); }
  if (q.open === 'true') and.push({ status: { $in: sla.OPEN } });
  const AGE = { lt1d: { $gt: ago(24) }, '1to3d': { $lte: ago(24), $gt: ago(72) }, '3to7d': { $lte: ago(72), $gt: ago(168) }, '7to14d': { $lte: ago(168), $gt: ago(336) }, gt14d: { $lte: ago(336) } };
  if (AGE[q.age]) and.push({ createdAt: AGE[q.age] }, { status: { $in: sla.OPEN } });
  if (q.search && q.search.trim()) {
    const rx = new RegExp(q.search.trim().split(/\s+/).map(esc).join('[\\s-]*'), 'i');
    const ids = (await User.find({ role: 'student', $or: [{ name: rx }, { studentId: rx }] }).select('_id').limit(500)).map((u) => u._id);
    and.push({ $or: [{ ticketNumber: rx }, { subject: rx }, { description: rx }, { student: { $in: ids } }] });
  }
  const filter = { $and: and };
  const sort = ['createdAt', '-createdAt', 'lastActivityAt', '-lastActivityAt'].includes(q.sort) ? q.sort : '-lastActivityAt';
  const [rows, total, st] = await Promise.all([Ticket.find(filter).populate(POP_LIST).sort(sort).skip(skip).limit(limit), Ticket.countDocuments(filter), getSettings()]);
  return { items: rows.map((t) => present(t, user, st)), pagination: meta(page, limit, total) };
}

async function get(user, id) {
  const t = await findAccessible(user, id); await t.populate(POP_FULL);
  return present(t, user, await getSettings());
}

async function update(user, id, body) {
  const t = await findAccessible(user, id); const st = await getSettings();
  if (!caps(user, t, st).edit) throw new AppError(403, 'This ticket can no longer be edited');
  if (body.category) { const c = await Category.findById(body.category); if (!c || !c.active) throw new AppError(422, 'Selected category is not available'); if (user.role === 'student') delete body.category; }
  const prev = {}, next = {};
  for (const k of ['subject', 'description', 'subcategory', 'category']) if (body[k] !== undefined && String(body[k]) !== String(t[k])) { prev[k] = t[k]; next[k] = body[k]; t[k] = body[k]; }
  if (!Object.keys(next).length) return get(user, id);
  t.lastActivityAt = new Date(); await t.save();
  await audit.log({ ticket: t._id, actor: user, action: 'TICKET_UPDATED', previousValue: prev, newValue: next });
  return get(user, id);
}

async function transition(t, to, actor, reason) {
  const from = t.status;
  if (!(TRANSITIONS[from] || []).includes(to)) throw new AppError(409, `A ticket cannot move from ${from} to ${to}`, 'INVALID_TRANSITION');
  if (to === 'Assigned' && !t.assignedTo) throw new AppError(409, 'Assign the ticket to a staff member first', 'INVALID_TRANSITION');
  const now = new Date(); const st = await getSettings();
  t.status = to; t.lastActivityAt = now;
  if (to === 'Resolved') t.resolvedAt = now;
  if (to === 'Closed') t.closedAt = now;
  if (to === 'Reopened') { t.resolvedAt = null; t.closedAt = null; }
  t.slaStatus = sla.computeStatus(t, st.dueSoonPercent, now);
  await t.save();
  const action = { Resolved: 'TICKET_RESOLVED', Closed: 'TICKET_CLOSED', Reopened: 'TICKET_REOPENED' }[to] || 'STATUS_CHANGED';
  await audit.log({ ticket: t._id, actor, action, previousValue: from, newValue: to, metadata: reason ? { reason } : undefined });
  const type = { Resolved: 'TICKET_RESOLVED', Reopened: 'TICKET_REOPENED' }[to] || 'STATUS_CHANGED';
  const title = { Resolved: 'Your request was resolved', Reopened: 'Ticket reopened' }[to] || 'Ticket status changed';
  const msg = `${t.ticketNumber} is now ${to}.`;
  if (idOf(t.student) !== String(actor._id)) await notif.notify(t.student, { type, title, message: msg, ticket: t._id });
  if (actor.role === 'student') await notif.notify(t.assignedTo ? [t.assignedTo] : await notif.managersOf(t.department), { type, title: title === 'Ticket status changed' ? `Student closed ${t.ticketNumber}` : title, message: msg, ticket: t._id });
  return t;
}

async function changeStatus(user, id, to) {
  if (!isStaff(user)) throw new AppError(403, 'Only staff can change ticket status');
  const t = await findAccessible(user, id);
  if (to === 'In Progress' && !t.assignedTo && user.role === 'staff') { // staff picking up an unassigned ticket
    t.assignedTo = user._id; await audit.log({ ticket: t._id, actor: user, action: 'TICKET_ASSIGNED', previousValue: null, newValue: String(user._id), metadata: { selfAssigned: true } });
  }
  await transition(t, to, user);
  return get(user, id);
}

async function assign(user, id, staffId) {
  if (!isMgr(user)) throw new AppError(403, 'Only managers and administrators can assign tickets');
  const t = await findAccessible(user, id);
  if (t.status === 'Closed') throw new AppError(409, 'Closed tickets cannot be assigned. Reopen the ticket first.');
  const target = await User.findById(staffId);
  if (!target) throw new AppError(404, 'Staff member not found');
  if (!target.active) throw new AppError(422, 'The selected staff member is inactive');
  if (!['staff', 'manager'].includes(target.role)) throw new AppError(422, 'Tickets can only be assigned to support staff or managers');
  if (t.department && target.department && String(t.department) !== String(target.department)) throw new AppError(422, 'The staff member belongs to a different department');
  if (idOf(t.assignedTo) === String(target._id)) throw new AppError(409, 'The ticket is already assigned to this person');
  const prev = t.assignedTo; t.assignedTo = target._id; t.lastActivityAt = new Date(); await t.save();
  await audit.log({ ticket: t._id, actor: user, action: prev ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED', previousValue: prev ? String(prev) : null, newValue: String(target._id), metadata: { assigneeName: target.name } });
  if (t.status === 'Open') await transition(t, 'Assigned', user);
  await notif.notify(target._id, { type: prev ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED', title: prev ? 'Ticket reassigned to you' : 'New ticket assigned', message: `${t.ticketNumber}: ${t.subject}`, ticket: t._id });
  if (prev) await notif.notify(prev, { type: 'TICKET_REASSIGNED', title: 'Ticket reassigned', message: `${t.ticketNumber} was reassigned to ${target.name}.`, ticket: t._id });
  await notif.notify(t.student, { type: 'TICKET_ASSIGNED', title: 'Your request was assigned', message: `${t.ticketNumber} is now handled by ${target.name}.`, ticket: t._id });
  return get(user, id);
}

async function changePriority(user, id, priority) {
  const t = await findAccessible(user, id); const st = await getSettings();
  if (!caps(user, t, st).changePriority) throw new AppError(403, 'You cannot change the priority of this ticket');
  if (t.priority === priority) return get(user, id);
  if (['Resolved', 'Closed'].includes(t.status)) throw new AppError(409, 'Priority cannot be changed on a resolved or closed ticket');
  const prev = t.priority; t.priority = priority; t.requestedUrgent = false;
  Object.assign(t, sla.deadlines(t.createdAt, await sla.policyFor(priority, await Category.findById(t.category))));
  t.slaStatus = sla.computeStatus(t, st.dueSoonPercent); t.lastActivityAt = new Date(); await t.save();
  await audit.log({ ticket: t._id, actor: user, action: 'PRIORITY_CHANGED', previousValue: prev, newValue: priority });
  return get(user, id);
}

async function reopen(user, id, reason) {
  const t = await findAccessible(user, id); const st = await getSettings();
  if (!caps(user, t, st).reopen) throw new AppError(409, t.status === 'Closed' ? 'The reopening period for this ticket has ended. Please create a new request.' : 'Only resolved or closed tickets can be reopened', 'INVALID_TRANSITION');
  await transition(t, 'Reopened', user, reason);
  return get(user, id);
}
async function close(user, id) {
  const t = await findAccessible(user, id);
  if (!isStaff(user) && idOf(t.student) !== String(user._id)) throw new AppError(403, 'Not allowed');
  await transition(t, 'Closed', user);
  return get(user, id);
}
async function remove(user, id) {
  if (user.role !== 'admin') throw new AppError(403, 'Only administrators can delete tickets');
  const t = await findAccessible(user, id); const msgs = await Message.find({ ticket: t._id });
  await audit.log({ ticket: null, actor: user, action: 'TICKET_DELETED', metadata: { ticketNumber: t.ticketNumber, ticketId: t._id, subject: t.subject } });
  msgs.forEach((m) => m.attachments.forEach((a) => fs.unlink(path.join(env.uploadDir, a.filename), () => {})));
  await Message.deleteMany({ ticket: t._id }); await t.deleteOne();
}

async function addMessage(user, id, { type, content }, files = [], { silent = false } = {}) {
  const t = await findAccessible(user, id);
  if (type === 'Internal Note' && !isStaff(user)) throw new AppError(403, 'Only staff can add internal notes');
  if (t.status === 'Closed' && type !== 'Internal Note') throw new AppError(409, 'This ticket is closed. Reopen it to continue the conversation.');
  if (!content && !files.length) throw new AppError(422, 'Write a message or attach a file');
  const m = await Message.create({ ticket: t._id, sender: user._id, type, content, attachments: files.map((f) => ({ originalName: f.originalname, filename: f.filename, mimeType: f.mimetype, size: f.size })) });
  const now = new Date(); t.lastActivityAt = now;
  const staffReply = isStaff(user) && type === 'Public Reply';
  if (staffReply && !t.firstResponseAt) { t.firstResponseAt = now; t.slaStatus = sla.computeStatus(t, (await getSettings()).dueSoonPercent, now); }
  await t.save();
  if (!silent) await audit.log({ ticket: t._id, actor: user, action: type === 'Internal Note' ? 'INTERNAL_NOTE_ADDED' : 'PUBLIC_REPLY_ADDED', metadata: { messageId: m._id } });
  if (files.length) await audit.log({ ticket: t._id, actor: user, action: 'ATTACHMENT_UPLOADED', metadata: { messageId: m._id, files: files.map((f) => f.originalname), internal: type === 'Internal Note' } });
  if (!silent && type === 'Public Reply') {
    if (staffReply) await notif.notify(t.student, { type: 'STAFF_REPLIED', title: 'New reply on your request', message: `${t.ticketNumber}: ${user.name} replied.`, ticket: t._id });
    else if (user.role === 'student') await notif.notify(t.assignedTo ? [t.assignedTo] : await notif.managersOf(t.department), { type: 'STUDENT_REPLIED', title: 'Student replied', message: `${t.ticketNumber}: new message from the student.`, ticket: t._id });
  }
  return Message.findById(m._id).populate('sender', 'name role');
}
async function listMessages(user, id) {
  const t = await findAccessible(user, id);
  const q = { ticket: t._id }; if (!isStaff(user)) q.type = 'Public Reply'; // students never receive internal notes
  return Message.find(q).populate('sender', 'name role').sort({ createdAt: 1 });
}
async function getFile(user, filename) {
  const m = await Message.findOne({ 'attachments.filename': filename });
  if (!m) throw new AppError(404, 'File not found');
  await findAccessible(user, m.ticket);
  if (m.type === 'Internal Note' && !isStaff(user)) throw new AppError(404, 'File not found');
  const a = m.attachments.find((x) => x.filename === filename);
  return { path: path.join(env.uploadDir, path.basename(filename)), ...a.toObject() };
}
async function history(user, id) { const t = await findAccessible(user, id); return audit.history(t._id, user); }

module.exports = { scope, TRANSITIONS, transition, create, list, get, update, changeStatus, assign, changePriority, reopen, close, remove, addMessage, listMessages, getFile, history, present };
