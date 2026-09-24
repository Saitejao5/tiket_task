const svc = require('../services/notification.service');
const { asyncHandler, ok } = require('../utils/http');
exports.list = asyncHandler(async (req, res) => ok(res, await svc.list(req.user, req.query)));
exports.read = asyncHandler(async (req, res) => ok(res, await svc.markRead(req.user, req.params.id), 'Marked as read'));
exports.readAll = asyncHandler(async (req, res) => { await svc.markAllRead(req.user); ok(res, null, 'All notifications marked as read'); });
