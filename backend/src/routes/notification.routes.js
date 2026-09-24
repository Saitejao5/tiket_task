const r = require('express').Router();
const c = require('../controllers/notification.controller');
r.use(require('../middleware/auth'));
r.get('/', c.list);
r.patch('/read-all', c.readAll);
r.patch('/:id/read', c.read);
module.exports = r;
