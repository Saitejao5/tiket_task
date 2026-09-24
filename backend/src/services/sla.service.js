const SlaPolicy = require('../models/SlaPolicy');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notif = require('./notification.service');
const { getSettings } = require('./settings.service');
const OPEN = ['Open', 'Assigned', 'In Progress', 'Pending', 'Reopened'];
exports.OPEN = OPEN;
exports.policyFor = async (priority, category) => {
  if (category && category.slaPolicy) { const p = await SlaPolicy.findOne({ _id: category.slaPolicy, active: true }); if (p && p.priority === priority) return p; }
  return SlaPolicy.findOne({ priority, active: true }).sort({ createdAt: 1 });
};
exports.deadlines = (createdAt, p) => p ? { firstResponseDue: new Date(+createdAt + p.firstResponseHours * 36e5), resolutionDue: new Date(+createdAt + p.resolutionHours * 36e5) } : { firstResponseDue: null, resolutionDue: null };
exports.computeStatus = (t, pct = 25, now = new Date()) => {
  const end = t.resolvedAt;
  if ((t.resolutionDue && (end || now) > t.resolutionDue) || (t.firstResponseDue && (t.firstResponseAt || now) > t.firstResponseDue)) return 'SLA Breached';
  if (end) return 'Within SLA';
  const soon = (due) => due && (due - now) <= (due - t.createdAt) * pct / 100;
  if ((!t.firstResponseAt && soon(t.firstResponseDue)) || soon(t.resolutionDue)) return 'Due Soon';
  return 'Within SLA';
};
// Periodic server-side job: refresh stored SLA status, raise SLA + pending notifications.
exports.refresh = async () => {
  const st = await getSettings(); const now = new Date();
  const tickets = await Ticket.find({ status: { $in: OPEN } });
  for (const t of tickets) {
    const next = exports.computeStatus(t, st.dueSoonPercent, now);
    if (next === t.slaStatus) continue;
    t.slaStatus = next;
    const to = [t.assignedTo];
    if (next === 'SLA Breached' && !t.slaNotified.breached) {
      t.slaNotified.breached = true;
      await notif.notify([...to, ...(await notif.managersOf(t.department))], { type: 'SLA_BREACHED', title: 'SLA breached', message: `${t.ticketNumber} has breached its SLA deadline.`, ticket: t._id });
    } else if (next === 'Due Soon' && !t.slaNotified.dueSoon) {
      t.slaNotified.dueSoon = true;
      await notif.notify(to, { type: 'SLA_DUE_SOON', title: 'Ticket approaching SLA deadline', message: `${t.ticketNumber} is close to its SLA deadline.`, ticket: t._id });
    }
    await t.save();
  }
  const pend = await Ticket.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: '$department', n: { $sum: 1 } } }, { $match: { n: { $gte: st.pendingAlertThreshold } } }]);
  for (const d of pend) for (const m of await notif.managersOf(d._id)) {
    const recent = await Notification.exists({ recipient: m, type: 'PENDING_HIGH', createdAt: { $gt: new Date(Date.now() - 864e5) } });
    if (!recent) await notif.notify(m, { type: 'PENDING_HIGH', title: 'Large number of pending tickets', message: `${d.n} tickets are currently pending.` });
  }
};
exports.start = (ms = 60000) => { const t = setInterval(() => exports.refresh().catch((e) => console.error('SLA job failed:', e.message)), ms); t.unref(); exports.refresh().catch(() => {}); return t; };
