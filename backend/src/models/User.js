const { Schema, model } = require('mongoose');
const s = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'staff', 'manager', 'admin'], required: true, index: true },
  studentId: { type: String, trim: true, unique: true, sparse: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  course: String, year: String, section: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });
s.set('toJSON', { transform: (d, r) => { delete r.passwordHash; delete r.__v; return r; } });
module.exports = model('User', s);
