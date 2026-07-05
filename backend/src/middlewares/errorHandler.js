const multer = require('multer');

const MULTER_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: 'One or more files exceed the 10 MB size limit',
  LIMIT_FILE_COUNT: 'Too many files attached',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
};

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: MULTER_ERROR_MESSAGES[err.code] || err.message });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
