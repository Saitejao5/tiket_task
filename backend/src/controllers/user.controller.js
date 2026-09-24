const svc = require('../services/user.service');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { asyncHandler, ok } = require('../utils/http');
exports.list = asyncHandler(async (req, res) => ok(res, await svc.list(req.query, req.user)));
exports.create = asyncHandler(async (req, res) => ok(res, await svc.create(req.body, req.user), 'User created', 201));
exports.update = asyncHandler(async (req, res) => ok(res, await svc.update(req.params.id, req.body, req.user), 'User updated'));
exports.get = asyncHandler(async (req, res) => { const u = await User.findById(req.params.id).populate('department', 'name code'); if (!u) throw new AppError(404, 'User not found'); ok(res, u); });
