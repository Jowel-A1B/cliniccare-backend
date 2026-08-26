const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: String, // "1+0+1" or "500mg"
    duration: String, // "7 days"
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null }, // V2
    medicines: [medicineSchema],
    testsSuggested: [String],
    followUpDate: Date,
    pdfPath: String, // relative path under /uploads/prescriptions
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
