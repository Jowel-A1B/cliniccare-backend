const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const InsuranceClaim = require('../models/InsuranceClaim');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { NOTIFICATION_TYPE } = require('../utils/constants');

// --- Insurance claim workflow -------------------------------------------------
// 1. Patient files a claim against one of their own invoices (insurer, policy
//    number, amount). The amount can't exceed the invoice total, and only one
//    live claim (processing/approved) is allowed per invoice.
// 2. Claim starts as `processing`.
// 3. The clinic admin whose clinic raised that invoice reviews it and either
//    approves it (recording an approved reimbursement amount + optional note)
//    or rejects it (with a reason). Only a `processing` claim can be decided.
// 4. The patient is notified of the outcome and sees the note + approved
//    amount on their claim card. Reimbursement is between the patient and
//    their insurer — the clinic invoice/payment is not altered by a claim.

const submitClaim = asyncHandler(async (req, res) => {
  const { invoiceId, insurerName, policyNumber, amountClaimed } = req.body;

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  if (!insurerName || !policyNumber) throw new ApiError(400, 'insurerName and policyNumber are required');

  const invoice = await Invoice.findOne({ _id: invoiceId, patientId: patient._id });
  if (!invoice) throw new ApiError(404, 'Invoice not found on your account');

  const amount = Number(amountClaimed);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'amountClaimed must be a positive number');
  }
  if (amount > invoice.total) {
    throw new ApiError(400, `The claim amount can't exceed the invoice total (৳${invoice.total})`);
  }

  const active = await InsuranceClaim.findOne({ invoiceId, status: { $in: ['processing', 'approved'] } });
  if (active) throw new ApiError(409, 'There is already an active insurance claim for this invoice');

  const claim = await InsuranceClaim.create({
    patientId: patient._id,
    invoiceId,
    insurerName,
    policyNumber,
    amountClaimed: amount,
  });
  res.status(201).json(new ApiResponse(201, claim, 'Claim submitted — the clinic will review it'));
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
  const { status, notes, approvedAmount } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, "status must be 'approved' or 'rejected'");
  }

  const claim = await InsuranceClaim.findById(req.params.id)
    .populate('invoiceId', 'clinicId total')
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } });
  if (!claim) throw new ApiError(404, 'Claim not found');

  // Security: only the admin who owns the clinic behind this claim's invoice
  // may approve/reject it — otherwise any admin could act on any claim.
  const clinic = await Clinic.findOne({ _id: claim.invoiceId.clinicId, ownerId: req.user.id });
  if (!clinic) throw new ApiError(403, "You do not manage this claim's clinic");

  // A claim is decided once — no flipping approved <-> rejected afterwards.
  if (claim.status !== 'processing') {
    throw new ApiError(409, `This claim has already been ${claim.status}`);
  }

  claim.status = status;
  claim.notes = notes || null;
  claim.decidedBy = req.user.id;
  claim.decidedAt = new Date();

  if (status === 'approved') {
    const approved = approvedAmount != null ? Number(approvedAmount) : claim.amountClaimed;
    if (!Number.isFinite(approved) || approved <= 0 || approved > claim.amountClaimed) {
      throw new ApiError(400, `Approved amount must be between 1 and the claimed amount (৳${claim.amountClaimed})`);
    }
    claim.approvedAmount = approved;
  }

  await claim.save();

  await logAudit({
    userId: req.user.id,
    userRole: req.user.role,
    action: `insurance_claim.${status}`,
    entityType: 'InsuranceClaim',
    entityId: claim._id,
    before: { status: 'processing' },
    after: { status, approvedAmount: claim.approvedAmount },
  });

  await notify({
    userId: claim.patientId.userId._id,
    userEmail: claim.patientId.userId.email,
    type: NOTIFICATION_TYPE.GENERAL,
    subject: `Insurance claim ${status}`,
    message:
      status === 'approved'
        ? `Your insurance claim for ৳${claim.amountClaimed} was approved for ৳${claim.approvedAmount}.${
            notes ? ` Note: ${notes}` : ''
          }`
        : `Your insurance claim for ৳${claim.amountClaimed} was rejected.${notes ? ` Reason: ${notes}` : ''}`,
  });

  res.json(new ApiResponse(200, claim, `Claim ${status}`));
});

module.exports = { submitClaim, getMyClaims, getClinicClaims, updateClaimStatus };
