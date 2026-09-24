const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Category = require('../models/Category');
const Department = require('../models/Department');
const { scope, present } = require('./ticket.service');
const { getSettings } = require('./settings.service');
const OPEN_LIKE = ['Open', 'Assigned', 'Reopened'];

const inS = (arr) => ({ $in: ['$status', arr] });

async function byStatus(match) {
  const rows = await Ticket.aggregate([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const o = {}; rows.forEach((r) => (o[r._id] = r.n));
  return { total: rows.reduce((a, r) => a + r.n, 0), open: (o.Open || 0) + (o.Assigned || 0) + (o.Reopened || 0), inProgress: o['In Progress'] || 0, pending: o.Pending || 0, resolved: o.Resolved || 0, closed: o.Closed || 0, raw: o };
}
async function recent(match, user, n = 6) {
  const st = await getSettings();
  const rows = await Ticket.find(match).populate([{ path: 'student', select: 'name studentId' }, { path: 'category', select: 'name' }, { path: 'assignedTo', select: 'name active' }]).sort('-lastActivityAt').limit(n);
  return rows.map((t) => present(t, user, st));
}
exports.student = async (user) => { const m = { student: user._id }; const s = await byStatus(m); delete s.raw; return { stats: s, recent: await recent(m, user, 5) }; };
exports.staff = async (user) => {
  const m = { assignedTo: user._id }; const s = await byStatus(m); const openM = { ...m, status: { $in: ['Open', 'Assigned', 'In Progress', 'Pending', 'Reopened'] } };
  const [dueSoon, breached] = await Promise.all([Ticket.countDocuments({ ...openM, slaStatus: 'Due Soon' }), Ticket.countDocuments({ ...openM, slaStatus: 'SLA Breached' })]);
  return { stats: { assigned: s.total, open: s.open, inProgress: s.inProgress, pending: s.pending, dueSoon, breached }, recent: await recent(m, user, 8) };
};
async function group(m, field, model) {
  const rows = await Ticket.aggregate([{ $match: m }, { $group: { _id: '$' + field, n: { $sum: 1 } } }]);
  let names = {};
  if (model) names = Object.fromEntries((await model.find({ _id: { $in: rows.map((r) => r._id).filter(Boolean) } }).select('name')).map((d) => [String(d._id), d.name]));
  return rows.map((r) => ({ label: model ? names[String(r._id)] || 'Unassigned' : r._id, count: r.n })).sort((x, y) => y.count - x.count);
}
exports.workload = async (user) => {
  const m = scope(user);
  const rows = await Ticket.aggregate([{ $match: { $and: [m, { assignedTo: { $ne: null } }] } }, { $group: { _id: { a: '$assignedTo', s: '$status', b: '$slaStatus' }, n: { $sum: 1 } } }]);
  const by = {};
  for (const { _id: k, n } of rows) {
    const r = (by[k.a] ||= { assigned: 0, open: 0, inProgress: 0, pending: 0, resolved: 0, breached: 0 });
    r.assigned += n; if (OPEN_LIKE.includes(k.s)) r.open += n; if (k.s === 'In Progress') r.inProgress += n; if (k.s === 'Pending') r.pending += n; if (['Resolved', 'Closed'].includes(k.s)) r.resolved += n; if (k.b === 'SLA Breached') r.breached += n;
  }
  const uq = { $or: [{ _id: { $in: Object.keys(by) } }, { role: { $in: ['staff', 'manager'] }, active: true, ...(user.role === 'manager' && user.department ? { department: user.department } : {}) }] };
  const users = await User.find(uq).select('name role active');
  return users.map((u) => ({ staffId: u._id, name: u.name, role: u.role, active: u.active, ...({ assigned: 0, open: 0, inProgress: 0, pending: 0, resolved: 0, breached: 0 }), ...(by[u._id] || {}) })).sort((a, b) => b.assigned - a.assigned);
};
exports.overview = async (user) => {
  const m = scope(user); const now = Date.now(); const d = (h) => new Date(now - h * 36e5); const OPEN = ['Open', 'Assigned', 'In Progress', 'Pending', 'Reopened'];
  const openM = { $and: [m, { status: { $in: OPEN } }] };
  const [s, byCategory, byPriority, byDepartment, byStatusRows, series, avg, ageRows, breached, dueSoon, unassigned, inactiveAssigned, workload, rec] = await Promise.all([
    byStatus(m), group(m, 'category', Category), group(m, 'priority'), group(m, 'department', Department), group(m, 'status'),
    Ticket.find({ $and: [m, { createdAt: { $gte: d(30 * 24) } }] }).select('createdAt').lean(),
    Ticket.find({ $and: [m, { resolvedAt: { $ne: null } }] }).select('createdAt resolvedAt').limit(20000).lean(),
    Ticket.find(openM).select('createdAt').lean(),
    Ticket.countDocuments({ $and: [openM, { slaStatus: 'SLA Breached' }] }), Ticket.countDocuments({ $and: [openM, { slaStatus: 'Due Soon' }] }),
    Ticket.countDocuments({ $and: [openM, { assignedTo: null }] }),
    Ticket.countDocuments({ $and: [openM, { assignedTo: { $in: (await User.find({ active: false }).select('_id')).map((u) => u._id) } }] }),
    exports.workload(user), recent(m, user, 8),
  ]);
  const map = {}; series.forEach((r) => { const k = r.createdAt.toISOString().slice(0, 10); map[k] = (map[k] || 0) + 1; }); const overTime = [];
  for (let i = 29; i >= 0; i--) { const k = new Date(now - i * 864e5).toISOString().slice(0, 10); overTime.push({ label: k, count: map[k] || 0 }); }
  const labels = ['More than 14 days', '7 to 14 days', '3 to 7 days', '1 to 3 days', 'Less than 24 hours'];
  const cuts = [336, 168, 72, 24].map((h) => +d(h));
  const ageing = labels.map((label, i) => ({ label, count: ageRows.filter((r) => { const t = +r.createdAt; return (i === 0 || t >= cuts[i - 1]) && (i === 4 || t < cuts[i]); }).length }));
  const { raw, ...stats } = s;
  return { stats: { ...stats, breached, dueSoon, unassigned, inactiveAssigned }, byCategory, byStatus: byStatusRows, byPriority, byDepartment, byStaff: workload.filter((w) => w.assigned).map((w) => ({ label: w.name, count: w.assigned })), overTime, avgResolutionHours: avg.length ? Math.round(avg.reduce((a, t) => a + (t.resolvedAt - t.createdAt), 0) / avg.length / 36e5 * 10) / 10 : null, ageing, workload, recent: rec };
};
exports.adminExtras = async () => { const [users, departments, categories] = await Promise.all([User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]), Department.countDocuments({ active: true }), Category.countDocuments({ active: true })]); return { users: Object.fromEntries(users.map((u) => [u._id, u.n])), departments, categories }; };
