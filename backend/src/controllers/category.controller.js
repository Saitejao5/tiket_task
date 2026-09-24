const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const audit = require('../services/audit.service');
const { asyncHandler, ok } = require('../utils/http');
const clean = (b) => ({ ...b, department: b.department || null, slaPolicy: b.slaPolicy || null });
exports.list = asyncHandler(async (req, res) => { const q = req.user?.role === 'admin' && req.query.all === 'true' ? {} : { active: true }; ok(res, await Category.find(q).populate('department', 'name code').populate('slaPolicy', 'name priority').sort('name')); });
exports.create = asyncHandler(async (req, res) => { const d = await Category.create(clean(req.body)); await audit.log({ actor: req.user, action: 'Category_CREATED'.toUpperCase(), metadata: { entity: 'Category', id: d._id, name: d.name } }); ok(res, d, 'Category created', 201); });
exports.update = asyncHandler(async (req, res) => { const d = await Category.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true }); if (!d) throw new AppError(404, 'Category not found'); await audit.log({ actor: req.user, action: 'Category_UPDATED'.toUpperCase(), metadata: { entity: 'Category', id: d._id, fields: Object.keys(req.body) } }); ok(res, d, 'Category updated'); });
exports.remove = asyncHandler(async (req, res) => { const d = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); if (!d) throw new AppError(404, 'Category not found'); await audit.log({ actor: req.user, action: 'Category_DEACTIVATED'.toUpperCase(), metadata: { entity: 'Category', id: d._id } }); ok(res, d, 'Category deactivated (existing tickets are preserved)'); });
