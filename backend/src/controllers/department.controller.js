const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const audit = require('../services/audit.service');
const { asyncHandler, ok } = require('../utils/http');
const clean = (b) => b;
exports.list = asyncHandler(async (req, res) => { const q = req.user?.role === 'admin' && req.query.all === 'true' ? {} : { active: true }; ok(res, await Department.find(q).sort('name')); });
exports.create = asyncHandler(async (req, res) => { const d = await Department.create(clean(req.body)); await audit.log({ actor: req.user, action: 'Department_CREATED'.toUpperCase(), metadata: { entity: 'Department', id: d._id, name: d.name } }); ok(res, d, 'Department created', 201); });
exports.update = asyncHandler(async (req, res) => { const d = await Department.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true }); if (!d) throw new AppError(404, 'Department not found'); await audit.log({ actor: req.user, action: 'Department_UPDATED'.toUpperCase(), metadata: { entity: 'Department', id: d._id, fields: Object.keys(req.body) } }); ok(res, d, 'Department updated'); });
exports.remove = asyncHandler(async (req, res) => { const d = await Department.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); if (!d) throw new AppError(404, 'Department not found'); await audit.log({ actor: req.user, action: 'Department_DEACTIVATED'.toUpperCase(), metadata: { entity: 'Department', id: d._id } }); ok(res, d, 'Department deactivated (existing tickets are preserved)'); });
