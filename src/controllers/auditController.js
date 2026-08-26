const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AuditLog = require('../models/AuditLog');

const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate('userId', 'name role').sort({ createdAt: -1 }).limit(200);
  res.json(new ApiResponse(200, logs));
});

module.exports = { listAuditLogs };
