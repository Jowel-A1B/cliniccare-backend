const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Bed = require('../models/Bed');
const Clinic = require('../models/Clinic');
const { logAudit } = require('../services/auditService');

async function assertOwnsClinic(userId, clinicId) {
  const clinic = await Clinic.findOne({ _id: clinicId, ownerId: userId });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');
}

const addBed = asyncHandler(async (req, res) => {
  await assertOwnsClinic(req.user.id, req.body.clinicId);
  const bed = await Bed.create(req.body);
  res.status(201).json(new ApiResponse(201, bed, 'Bed added'));
});

const listBeds = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const beds = await Bed.find({ clinicId: { $in: clinics.map((c) => c._id) } })
    .populate({ path: 'currentPatientId', populate: { path: 'userId', select: 'name' } })
    .sort({ ward: 1, bedNumber: 1 });
  res.json(new ApiResponse(200, beds));
});

const assignBed = asyncHandler(async (req, res) => {
  const { patientId } = req.body;
  const bed = await Bed.findById(req.params.id);
  if (!bed) throw new ApiError(404, 'Bed not found');
  await assertOwnsClinic(req.user.id, bed.clinicId);
  if (bed.status === 'occupied') throw new ApiError(409, 'Bed is already occupied');

  const before = { status: bed.status };
  bed.status = 'occupied';
  bed.currentPatientId = patientId;
  await bed.save();

  await logAudit({ userId: req.user.id, userRole: req.user.role, action: 'bed.assigned', entityType: 'Bed', entityId: bed._id, before, after: { status: bed.status, patientId } });
  res.json(new ApiResponse(200, bed, 'Bed assigned'));
});

const releaseBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) throw new ApiError(404, 'Bed not found');
  await assertOwnsClinic(req.user.id, bed.clinicId);

  const before = { status: bed.status };
  bed.status = 'available';
  bed.currentPatientId = null;
  await bed.save();

  await logAudit({ userId: req.user.id, userRole: req.user.role, action: 'bed.released', entityType: 'Bed', entityId: bed._id, before, after: { status: bed.status } });
  res.json(new ApiResponse(200, bed, 'Bed released'));
});

const deleteBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) throw new ApiError(404, 'Bed not found');
  await assertOwnsClinic(req.user.id, bed.clinicId);
  await bed.deleteOne();
  res.json(new ApiResponse(200, null, 'Bed removed'));
});

module.exports = { addBed, listBeds, assignBed, releaseBed, deleteBed };
