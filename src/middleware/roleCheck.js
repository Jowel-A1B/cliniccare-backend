const ApiError = require('../utils/ApiError');

// Usage: router.get('/x', protect, allowRoles('admin', 'doctor'), handler)
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'Forbidden: insufficient role permissions');
  }
  next();
};

module.exports = { allowRoles };
