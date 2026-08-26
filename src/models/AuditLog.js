const mongoose = require('mongoose');

// Immutable-by-convention change log for sensitive mutations (appointment
// status, invoices, inventory, bed assignment). Not every mutation in the
// app is instrumented — see services/auditService.js for the pattern and
// where the highest-value entries are logged from.
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: String,
    action: { type: String, required: true }, // "appointment.status_changed", "invoice.created"...
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
