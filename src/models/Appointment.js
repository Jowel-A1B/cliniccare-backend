const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // "17:30"
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
      index: true,
    },
    reason: String,
    // V2: family patient management — if booked for a dependent rather than
    // the account owner, this points at that FamilyMember; null = self.
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
    // V2: QR check-in
    checkInToken: { type: String }, // random token embedded in the QR code
    checkedIn: { type: Boolean, default: false },
    checkedInAt: Date,
    // V4: dynamic pricing — the fee actually in effect at booking time, so
    // later invoicing reflects what was quoted, not today's price.
    feeCharged: Number,
    // V3 will add a `priority` field (emergency/urgent/normal) here — additive change.
  },
  { timestamps: true }
);

// Prevents double-booking the same doctor/date/slot at the DB level.
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: false });

module.exports = mongoose.model('Appointment', appointmentSchema);
