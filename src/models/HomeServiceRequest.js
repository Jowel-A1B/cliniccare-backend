const mongoose = require('mongoose');

const homeServiceRequestSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
    serviceType: { type: String, enum: ['blood_test', 'nurse_visit', 'physiotherapy'], required: true },
    address: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    status: { type: String, enum: ['requested', 'scheduled', 'completed', 'cancelled'], default: 'requested', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeServiceRequest', homeServiceRequestSchema);
