const { Schema, model } = require('mongoose');
const s = new Schema({
  ticketNumber: { type: String, required: true, unique: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subcategory: String,
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium', index: true },
  requestedUrgent: { type: Boolean, default: false },
  status: { type: String, enum: ['Open', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Reopened'], default: 'Open', index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  firstResponseDue: Date, resolutionDue: Date, firstResponseAt: Date, resolvedAt: Date, closedAt: Date,
  slaStatus: { type: String, enum: ['Within SLA', 'Due Soon', 'SLA Breached'], default: 'Within SLA', index: true },
  slaNotified: { dueSoon: { type: Boolean, default: false }, breached: { type: Boolean, default: false } },
  lastActivityAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
s.index({ createdAt: -1 });
module.exports = model('Ticket', s);
