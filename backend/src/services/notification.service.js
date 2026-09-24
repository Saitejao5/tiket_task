const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { parsePage, meta } = require('../utils/pagination');
exports.notify = async (recipients, { type, title, message, ticket }) => {
  try {
    const ids = [...new Set((Array.isArray(recipients) ? recipients : [recipients]).filter(Boolean).map((r) => String(r._id || r)))];
    if (ids.length) await Notification.insertMany(ids.map((recipient) => ({ recipient, type, title, message, ticket })));
  } catch (e) { console.error('Notification failed:', e.message); }
};
exports.managersOf = async (department) => (await User.find({ role: 'manager', active: true, $or: [{ department }, { department: null }] }).select('_id')).map((u) => u._id);
exports.list = async (user, query) => {
  const { page, limit, skip } = parsePage(query); const q = { recipient: user._id }; if (query.unread === 'true') q.read = false;
  const [items, total, unread] = await Promise.all([Notification.find(q).populate('ticket', 'ticketNumber').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Notification.countDocuments(q), Notification.countDocuments({ recipient: user._id, read: false })]);
  return { items, unread, pagination: meta(page, limit, total) };
};
exports.markRead = async (user, id) => { const n = await Notification.findOneAndUpdate({ _id: id, recipient: user._id }, { read: true }, { new: true }); if (!n) throw new AppError(404, 'Notification not found'); return n; };
exports.markAllRead = (user) => Notification.updateMany({ recipient: user._id, read: false }, { read: true });
