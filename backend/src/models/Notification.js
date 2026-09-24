const { Schema, model } = require('mongoose');
const s = new Schema({ recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true }, type: { type: String, required: true }, title: { type: String, required: true }, message: String, ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', default: null }, read: { type: Boolean, default: false } }, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ recipient: 1, read: 1, createdAt: -1 });
module.exports = model('Notification', s);
