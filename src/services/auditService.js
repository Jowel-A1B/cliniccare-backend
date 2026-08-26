const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit logging — never blocks or fails the calling request
// (a missed audit entry shouldn't break a booking). Call this from the
// highest-value mutation points: status changes, money, and capacity.
async function logAudit({ userId, userRole, action, entityType, entityId, before, after }) {
  try {
    await AuditLog.create({ userId, userRole, action, entityType, entityId, before, after });
  } catch (err) {
    console.error('[auditService] failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
