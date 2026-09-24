const AppError = require('../utils/AppError');
module.exports = (schema, src = 'body') => (req, res, next) => {
  const r = schema.safeParse(req[src] || {});
  if (!r.success) return next(new AppError(422, r.error.issues.map((i) => `${i.path.join('.') || 'request'}: ${i.message}`).join('; '), 'VALIDATION_ERROR'));
  req[src] = r.data; next();
};
