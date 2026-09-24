const SlaPolicy = require('../models/SlaPolicy');
const AppError = require('../utils/AppError');
const audit = require('../services/audit.service');
const { asyncHandler, ok } = require('../utils/http');
const clean = (b) => b;
exports.list = asyncHandler(async (req, res) => { const q = req.user?.role === 'admin' && req.query.all === 'true' ? {} : { active: true }; ok(res, await SlaPolicy.find(q).sort('priority')); });
exports.create = asyncHandler(async (req, res) => { const d = await SlaPolicy.create(clean(req.body)); await audit.log({ actor: req.user, action: 'SlaPolicy_CREATED'.toUpperCase(), metadata: { entity: 'SlaPolicy', id: d._id, name: d.name } }); ok(res, d, 'SlaPolicy created', 201); });
exports.update = asyncHandler(async (req, res) => { const d = await SlaPolicy.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true }); if (!d) throw new AppError(404, 'SlaPolicy not found'); await audit.log({ actor: req.user, action: 'SlaPolicy_UPDATED'.toUpperCase(), metadata: { entity: 'SlaPolicy', id: d._id, fields: Object.keys(req.body) } }); ok(res, d, 'SlaPolicy updated'); });
exports.remove = asyncHandler(async (req, res) => { const d = await SlaPolicy.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); if (!d) throw new AppError(404, 'SlaPolicy not found'); await audit.log({ actor: req.user, action: 'SlaPolicy_DEACTIVATED'.toUpperCase(), metadata: { entity: 'SlaPolicy', id: d._id } }); ok(res, d, 'SlaPolicy deactivated (existing tickets are preserved)'); });
