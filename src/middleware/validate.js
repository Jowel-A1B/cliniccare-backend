const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run after express-validator chains; turns validation errors into ApiError.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }
  next();
};

module.exports = validate;
