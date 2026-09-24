const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
module.exports = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) throw new AppError(401, 'Authentication required');
    let p; try { p = jwt.verify(token, env.jwtSecret); } catch { throw new AppError(401, 'Session expired. Please sign in again.'); }
    const user = await User.findById(p.sub);
    if (!user || !user.active) throw new AppError(401, 'Account not found or deactivated');
    req.user = user; next();
  } catch (e) { next(e); }
};
