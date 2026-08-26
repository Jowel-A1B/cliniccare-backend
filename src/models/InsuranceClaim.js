const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    insurerName: { type: String, required: true },
    policyNumber: { type: String, required: true },
    amountClaimed: { type: Number, required: true },
    status: { type: String, enum: ['processing', 'approved', 'rejected'], default: 'processing', index: true },
    notes: String, // admin's decision note
  },
  { timestamps: true }
);

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
