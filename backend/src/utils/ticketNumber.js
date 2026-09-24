const Counter = require('../models/Counter');
exports.format = (year, seq) => `TKT-${year}-${String(seq).padStart(6, '0')}`;
exports.nextTicketNumber = async () => {
  const year = new Date().getFullYear();
  const c = await Counter.findOneAndUpdate({ _id: `ticket-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return exports.format(year, c.seq);
};
