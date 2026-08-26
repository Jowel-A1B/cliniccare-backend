const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const { getProvider } = require('../services/paymentService');
const env = require('../config/env');

const initiatePayment = asyncHandler(async (req, res) => {
  const { invoiceId } = req.body;
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (invoice.status === 'paid') throw new ApiError(400, 'This invoice is already paid');

  const provider = getProvider(env.payment.provider);
  const { transactionId, paymentUrl } = await provider.initiate({ amount: invoice.total, invoiceId });

  const payment = await Payment.create({
    invoiceId,
    payerId: req.user.id,
    provider: env.payment.provider,
    amount: invoice.total,
    transactionId,
    status: 'pending',
  });

  res.status(201).json(new ApiResponse(201, { paymentId: payment._id, transactionId, paymentUrl }, 'Payment initiated'));
});

// In a real gateway this would be a server-to-server webhook. For the mock
// provider (and as a manual "Confirm Payment" button in dev), the frontend
// calls this directly with the transactionId it got from initiate().
const confirmPayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  const payment = await Payment.findOne({ transactionId });
  if (!payment) throw new ApiError(404, 'Payment not found');

  const provider = getProvider(payment.provider);
  const result = await provider.confirm({ transactionId });

  payment.status = result.success ? 'success' : 'failed';
  await payment.save();

  if (result.success) {
    await Invoice.findByIdAndUpdate(payment.invoiceId, { status: 'paid', paymentId: payment._id });
  }

  res.json(new ApiResponse(200, payment, result.success ? 'Payment successful' : 'Payment failed'));
});

module.exports = { initiatePayment, confirmPayment };
