const { Schema, model } = require('mongoose');
const s = new Schema({ ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', default: null, index: true }, actor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, action: { type: String, required: true, index: true }, previousValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed, metadata: Schema.Types.Mixed }, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ createdAt: -1 });
// Append-only: block updates and deletes through the application layer.
const block = () => { throw new Error('Audit logs are append-only'); };
['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'].forEach((h) => s.pre(h, block));
s.pre('save', function (next) { if (!this.isNew) return next(new Error('Audit logs are append-only')); next(); });
module.exports = model('AuditLog', s);
