// Central place for enums/constants so V2/V3 features can extend these
// without touching every file that references a role or status string.

const ROLES = Object.freeze({
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin', // clinic admin
});

const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show', // V3: lets admin/doctor mark a missed visit, which feeds no-show risk analytics
});

const NOTIFICATION_TYPE = Object.freeze({
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_STATUS_CHANGED: 'appointment_status_changed',
  GENERAL: 'general',
});

module.exports = { ROLES, APPOINTMENT_STATUS, NOTIFICATION_TYPE };
