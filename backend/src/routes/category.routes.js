const r = require('express').Router();
const c = require('../controllers/category.controller');
const auth = require('../middleware/auth'), role = require('../middleware/role'), validate = require('../middleware/validation'), v = require('../utils/validators');

r.get('/', auth, c.list);
r.post('/', auth, role('admin'), validate(v.category), c.create);
r.patch('/:id', auth, role('admin'), validate(v.category.partial()), c.update);
r.delete('/:id', auth, role('admin'), c.remove);
module.exports = r;
