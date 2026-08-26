const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: String,
    address: String,
    emergencyContact: String,
    // V3: doctor notes sharing permission — a doctor the patient has NOT had
    // a direct appointment with can still view history if listed here
    // (e.g. for a second opinion). Enforced in recordController.getPatientHistory.
    sharedWithDoctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    // V2 will extend this with a `dependents` array for family patient management
    // without breaking this schema (fields are additive).
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
