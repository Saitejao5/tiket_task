const r = require('express').Router();
const m = require('../controllers/message.controller');
r.use(require('../middleware/auth'));
r.get('/:filename', m.file); // authorised file download
module.exports = r;
