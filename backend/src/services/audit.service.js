const AuditLog = require('../models/AuditLog');
const { parsePage, meta } = require('../utils/pagination');
exports.log = ({ ticket = null, actor, action, previousValue, newValue, metadata }) => AuditLog.create({ ticket, actor: actor._id || actor, action, previousValue, newValue, metadata });
exports.history = async (ticketId, user) => {
  const q = { ticket: ticketId }; if (user.role === 'student') q.action = { $ne: 'INTERNAL_NOTE_ADDED' };
  const rows = await AuditLog.find(q).populate('actor', 'name role').sort({ createdAt: 1 }).lean();
  return user.role === 'student' ? rows.map(({ metadata, previousValue, newValue, ...r }) => ({ ...r, previousValue: ['STATUS_CHANGED', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'TICKET_REOPENED', 'PRIORITY_CHANGED'].includes(r.action) ? previousValue : undefined, newValue: ['STATUS_CHANGED', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'TICKET_REOPENED', 'PRIORITY_CHANGED'].includes(r.action) ? newValue : undefined })) : rows;
};
exports.list = async (query) => {
  const { page, limit, skip } = parsePage(query); const q = {};
  if (query.action) q.action = query.action;
  if (query.ticket) q.ticket = query.ticket;
  const [items, total] = await Promise.all([AuditLog.find(q).populate('actor', 'name role').populate('ticket', 'ticketNumber').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AuditLog.countDocuments(q)]);
  return { items, pagination: meta(page, limit, total) };
};
