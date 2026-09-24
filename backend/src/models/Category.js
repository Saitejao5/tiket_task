const { Schema, model } = require('mongoose');
module.exports = model('Category', new Schema({
  name: { type: String, required: true, unique: true, trim: true }, description: String,
  department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  subcategories: [String],
  defaultPriority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  slaPolicy: { type: Schema.Types.ObjectId, ref: 'SlaPolicy', default: null },
  active: { type: Boolean, default: true },
}, { timestamps: true }));
