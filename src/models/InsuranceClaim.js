const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    insurerName: { type: String, required: true },
    policyNumber: { type: String, required: true },
    amountClaimed: { type: Number, required: true },
    status: { type: String, enum: ['processing', 'approved', 'rejected'], default: 'processing', index: true },
    notes: String, // admin's decision note (approval remark / rejection reason)
    approvedAmount: { type: Number, default: null }, // set on approval; may be <= amountClaimed
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
