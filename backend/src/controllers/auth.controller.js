const bcrypt = require('bcrypt'), jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const users = require('../services/user.service');
const { asyncHandler, ok } = require('../utils/http');
const sign = (u) => jwt.sign({ sub: String(u._id), role: u.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
const me = (id) => User.findById(id).populate('department', 'name code');
exports.register = asyncHandler(async (req, res) => { const u = await users.create({ ...req.body, role: 'student' }); ok(res, { token: sign(u), user: await me(u._id) }, 'Account created successfully', 201); });
exports.login = asyncHandler(async (req, res) => {
  const u = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!u || !(await bcrypt.compare(req.body.password, u.passwordHash))) throw new AppError(401, 'Incorrect email or password');
  if (!u.active) throw new AppError(403, 'This account has been deactivated. Contact the administrator.');
  ok(res, { token: sign(u), user: await me(u._id) }, 'Signed in successfully');
});
exports.logout = asyncHandler(async (req, res) => ok(res, null, 'Signed out'));
exports.me = asyncHandler(async (req, res) => ok(res, await me(req.user._id)));
exports.updateMe = asyncHandler(async (req, res) => {
  const { newPassword, currentPassword, ...rest } = req.body; const u = await User.findById(req.user._id).select('+passwordHash');
  if (newPassword) { if (!currentPassword || !(await bcrypt.compare(currentPassword, u.passwordHash))) throw new AppError(422, 'Current password is incorrect'); u.passwordHash = await users.hash(newPassword); }
  if (u.role === 'student') Object.assign(u, rest); else if (rest.name) u.name = rest.name;
  await u.save(); ok(res, await me(u._id), 'Profile updated');
});
