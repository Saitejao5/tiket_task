const { Schema, model } = require('mongoose');
module.exports = model('Message', new Schema({
  ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Public Reply', 'Internal Note'], default: 'Public Reply' },
  content: { type: String, default: '' },
  attachments: [{ _id: false, originalName: String, filename: String, mimeType: String, size: Number }],
}, { timestamps: true }));
