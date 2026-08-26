const mongoose = require('mongoose');

// Provider-agnostic payment record. `provider` + `providerRef` let you trace
// back to the real bKash/SSLCommerz transaction once a real adapter is wired
// in (see services/paymentService.js) without changing this schema.
const paymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['mock', 'bkash', 'nagad', 'sslcommerz'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
    transactionId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
