const { Schema, model } = require('mongoose');
module.exports = model('Department', new Schema({ name: { type: String, required: true, unique: true, trim: true }, code: { type: String, required: true, unique: true, uppercase: true, trim: true }, description: String, active: { type: Boolean, default: true } }, { timestamps: true }));
