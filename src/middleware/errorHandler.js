const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Mongoose validation / cast errors
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${Object.keys(err.keyValue).join(', ')}`,
    });
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = errorHandler;
