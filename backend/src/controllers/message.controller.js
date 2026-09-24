const svc = require('../services/ticket.service');
const { removeFiles } = require('../middleware/upload');
const { asyncHandler, ok } = require('../utils/http');
exports.list = asyncHandler(async (req, res) => ok(res, await svc.listMessages(req.user, req.params.ticketId)));
exports.create = asyncHandler(async (req, res) => { try { ok(res, await svc.addMessage(req.user, req.params.ticketId, req.body, req.files || []), 'Message sent', 201); } catch (e) { removeFiles(req.files); throw e; } });
exports.file = asyncHandler(async (req, res) => { const f = await svc.getFile(req.user, req.params.filename); res.type(f.mimeType); res.download(f.path, f.originalName); });
