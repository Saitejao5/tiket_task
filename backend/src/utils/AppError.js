const CODES = { 400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'VALIDATION_ERROR', 429: 'TOO_MANY_REQUESTS' };
class AppError extends Error { constructor(status, message, code) { super(message); this.status = status; this.code = code || CODES[status] || 'ERROR'; } }
module.exports = AppError;
