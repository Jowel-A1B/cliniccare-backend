const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

// Verifies JWT and attaches req.user = { id, role }.
// Kept separate from roleCheck so V2 (e.g. staff sub-roles) can compose
// new checks without touching this core auth logic.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Not authorized, user no longer active');
  }

  req.user = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
  next();
});

module.exports = { protect };
