const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Invoice = require('../models/Invoice');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');

// Admin creates a bill for an appointment (consultation fee + any extra
// items like tests). Kept separate from Appointment so V4's expense/revenue
// reporting can query Invoice without touching booking logic.
const createInvoice = asyncHandler(async (req, res) => {
  const { appointmentId, items } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const clinic = await Clinic.findOne({ _id: appointment.clinicId, ownerId: req.user.id });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');

  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);

  const invoice = await Invoice.create({
    appointmentId,
    patientId: appointment.patientId,
    clinicId: appointment.clinicId,
    items,
    total,
  });

  res.status(201).json(new ApiResponse(201, invoice, 'Invoice created'));
});

const getMyInvoicesAsPatient = asyncHandler(async (req, res) => {
  const Patient = require('../models/Patient');
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const invoices = await Invoice.find({ patientId: patient._id })
    .populate('clinicId', 'name')
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, invoices));
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('clinicId', 'name');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  res.json(new ApiResponse(200, invoice));
});

module.exports = { createInvoice, getMyInvoicesAsPatient, getInvoiceById };
