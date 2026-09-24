const r = require('express').Router();
const c = require('../controllers/department.controller');
const auth = require('../middleware/auth'), role = require('../middleware/role'), validate = require('../middleware/validation'), v = require('../utils/validators');

r.get('/', (req, res, next) => (req.headers.authorization ? auth(req, res, next) : next()), c.list); // public: registration form needs departments
r.post('/', auth, role('admin'), validate(v.department), c.create);
r.patch('/:id', auth, role('admin'), validate(v.department_patch), c.update);
r.delete('/:id', auth, role('admin'), c.remove);
module.exports = r;
