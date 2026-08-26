const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    fromDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    toDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'acknowledged'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referral', referralSchema);
