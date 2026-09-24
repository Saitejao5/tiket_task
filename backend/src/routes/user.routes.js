const r = require('express').Router();
const c = require('../controllers/user.controller');
const auth = require('../middleware/auth'), role = require('../middleware/role'), validate = require('../middleware/validation'), v = require('../utils/validators');
r.use(auth);
r.get('/', role('admin', 'manager'), c.list);
r.post('/', role('admin'), validate(v.userCreate), c.create);
r.get('/:id', role('admin'), c.get);
r.patch('/:id', role('admin'), validate(v.userUpdate), c.update);
module.exports = r;
