const mongoose = require('mongoose');

// Patient asks a different doctor to review an existing record/prescription.
// Accepting the request implicitly grants that doctor read access to the
// patient's history for the duration (handled in controller, not schema).
const secondOpinionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    originalAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    requestedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    note: String, // patient's question / context for the reviewing doctor
    status: { type: String, enum: ['pending', 'responded'], default: 'pending', index: true },
    response: String, // reviewing doctor's opinion
    respondedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecondOpinionRequest', secondOpinionSchema);
