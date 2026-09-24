const r = require('express').Router();
const c = require('../controllers/audit.controller');
const auth = require('../middleware/auth'), role = require('../middleware/role'), validate = require('../middleware/validation'), v = require('../utils/validators');
r.get('/audit-logs', auth, role('admin'), c.list);
r.get('/settings', auth, c.getSettings);
r.patch('/settings', auth, role('admin'), validate(v.settings), c.updateSettings);
module.exports = r;
