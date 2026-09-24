const audit = require('../services/audit.service');
const settings = require('../services/settings.service');
const { asyncHandler, ok } = require('../utils/http');
exports.list = asyncHandler(async (req, res) => ok(res, await audit.list(req.query)));
exports.getSettings = asyncHandler(async (req, res) => ok(res, await settings.getSettings()));
exports.updateSettings = asyncHandler(async (req, res) => ok(res, await settings.updateSettings(req.body), 'Settings saved'));
