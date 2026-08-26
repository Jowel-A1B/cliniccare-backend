const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const InsuranceClaim = require('../models/InsuranceClaim');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');

const submitClaim = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const invoice = await Invoice.findOne({ _id: req.body.invoiceId, patientId: patient._id });
  if (!invoice) throw new ApiError(404, 'Invoice not found on your account');

  const claim = await InsuranceClaim.create({ ...req.body, patientId: patient._id });
  res.status(201).json(new ApiResponse(201, claim, 'Claim submitted'));
});

const getMyClaims = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const claims = await InsuranceClaim.find({ patientId: patient._id }).populate('invoiceId').sort({ createdAt: -1 });
  res.json(new ApiResponse(200, claims));
});

// Admin sees claims tied to invoices from clinics they manage.
const getClinicClaims = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const invoices = await Invoice.find({ clinicId: { $in: clinics.map((c) => c._id) } }).select('_id');

  const claims = await InsuranceClaim.find({ invoiceId: { $in: invoices.map((i) => i._id) } })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .populate('invoiceId')
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, claims));
});

const updateClaimStatus = asyncHandler(async (req, res) => {
  const claim = await InsuranceClaim.findById(req.params.id).populate('invoiceId', 'clinicId');
  if (!claim) throw new ApiError(404, 'Claim not found');

  // Security: only the admin who owns the clinic behind this claim's invoice
  // may approve/reject it — otherwise any admin could act on any claim.
  const clinic = await Clinic.findOne({ _id: claim.invoiceId.clinicId, ownerId: req.user.id });
  if (!clinic) throw new ApiError(403, 'You do not manage this claim\'s clinic');

  claim.status = req.body.status;
  claim.notes = req.body.notes;
  await claim.save();
  res.json(new ApiResponse(200, claim, 'Claim updated'));
});

module.exports = { submitClaim, getMyClaims, getClinicClaims, updateClaimStatus };
