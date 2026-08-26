const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // "Consultation Fee", "Blood Test", ...
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    items: [invoiceItemSchema],
    total: { type: Number, required: true },
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid', index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
