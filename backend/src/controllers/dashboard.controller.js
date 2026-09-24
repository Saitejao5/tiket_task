const svc = require('../services/dashboard.service');
const { asyncHandler, ok } = require('../utils/http');
exports.student = asyncHandler(async (req, res) => ok(res, await svc.student(req.user)));
exports.staff = asyncHandler(async (req, res) => ok(res, await svc.staff(req.user)));
exports.manager = asyncHandler(async (req, res) => ok(res, await svc.overview(req.user)));
exports.admin = asyncHandler(async (req, res) => { const [o, x] = await Promise.all([svc.overview(req.user), svc.adminExtras()]); ok(res, { ...o, system: x }); });
exports.workload = asyncHandler(async (req, res) => ok(res, await svc.workload(req.user)));
