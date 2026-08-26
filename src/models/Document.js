const mongoose = require('mongoose');

// "Document Vault" — X-rays, blood reports, discharge summaries etc.
// Patients can view their own vault; a doctor can view a patient's vault
// only in the context of a shared appointment (checked in controller).
const documentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' }, // optional: whose document
    title: { type: String, required: true },
    category: { type: String, enum: ['xray', 'blood_test', 'mri', 'prescription', 'discharge_summary', 'other'], default: 'other' },
    filePath: { type: String, required: true },
    mimeType: String,
    sizeBytes: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
