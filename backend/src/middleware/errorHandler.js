const { MulterError } = require('multer');
exports.notFound = (req, res) => res.status(404).json({ success: false, message: 'Route not found', error: 'NOT_FOUND' });
exports.errorHandler = (err, req, res, next) => {
  let s = err.status || 500, m = err.message, c = err.code;
  if (err instanceof MulterError) { s = 422; c = 'UPLOAD_ERROR'; m = err.code === 'LIMIT_FILE_SIZE' ? 'A file exceeds the 10 MB limit' : ['LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(err.code) ? 'A maximum of 5 attachments is allowed' : 'Upload failed'; }
  else if (err.name === 'CastError') { s = 404; m = 'Resource not found'; c = 'NOT_FOUND'; }
  else if (err.name === 'ValidationError') { s = 422; m = 'Validation failed'; c = 'VALIDATION_ERROR'; }
  else if (err.code === 11000) { s = 409; m = 'A record with the same unique value already exists'; c = 'CONFLICT'; }
  else if (err.type === 'entity.parse.failed') { s = 400; m = 'Invalid JSON body'; c = 'BAD_REQUEST'; }
  if (s >= 500) { console.error(err); s = 500; m = 'Something went wrong. Please try again.'; c = 'INTERNAL_SERVER_ERROR'; }
  res.status(s).json({ success: false, message: m, error: c || 'ERROR' });
};
