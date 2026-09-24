const bcrypt = require('bcrypt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const audit = require('./audit.service');
const { parsePage, meta } = require('../utils/pagination');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hash = (p) => bcrypt.hash(p, 10);
exports.hash = hash;
exports.create = async (data, actor) => {
  if (data.role === 'student' && !data.studentId) throw new AppError(422, 'Student ID is required for students');
  const { password, ...rest } = data;
  if (rest.role !== 'student') delete rest.studentId;
  const u = await User.create({ ...rest, email: rest.email.toLowerCase(), passwordHash: await hash(password) });
  if (actor) await audit.log({ actor, action: 'USER_CREATED', metadata: { entity: 'User', id: u._id, email: u.email, role: u.role } });
  return u;
};
exports.update = async (id, data, actor) => {
  const u = await User.findById(id); if (!u) throw new AppError(404, 'User not found');
  if (String(u._id) === String(actor._id) && (data.active === false || (data.role && data.role !== u.role))) throw new AppError(409, 'You cannot deactivate or change the role of your own account');
  const { password, ...rest } = data;
  if (rest.department === '') rest.department = null;
  Object.assign(u, rest); if (password) u.passwordHash = await hash(password);
  await u.save();
  await audit.log({ actor, action: 'USER_UPDATED', metadata: { entity: 'User', id: u._id, fields: Object.keys(data).filter((k) => k !== 'password') } });
  return u;
};
exports.list = async (query, actor) => {
  const { page, limit, skip } = parsePage(query); const q = {};
  if (actor.role === 'manager') { q.role = { $in: ['staff', 'manager'] }; q.active = true; } // managers only need assignable people
  if (query.role && (actor.role === 'admin' || ['staff', 'manager'].includes(query.role))) q.role = query.role;
  if (query.active !== undefined && actor.role === 'admin') q.active = query.active === 'true';
  if (query.department) q.department = query.department;
  if (query.search) { const rx = new RegExp(esc(query.search.trim()), 'i'); q.$or = [{ name: rx }, { email: rx }, { studentId: rx }]; }
  const [items, total] = await Promise.all([User.find(q).populate('department', 'name code').sort({ name: 1 }).skip(skip).limit(limit), User.countDocuments(q)]);
  return { items, pagination: meta(page, limit, total) };
};
