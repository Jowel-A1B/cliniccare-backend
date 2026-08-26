const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const OperationSchedule = require('../models/OperationSchedule');
const Clinic = require('../models/Clinic');

async function assertOwnsClinic(userId, clinicId) {
  const clinic = await Clinic.findOne({ _id: clinicId, ownerId: userId });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');
}

const scheduleOperation = asyncHandler(async (req, res) => {
  await assertOwnsClinic(req.user.id, req.body.clinicId);
  // prevent double-booking the same OT room/date/time
  const clash = await OperationSchedule.findOne({
    clinicId: req.body.clinicId,
    otRoom: req.body.otRoom,
    date: req.body.date,
    startTime: req.body.startTime,
    status: 'scheduled',
  });
  if (clash) throw new ApiError(409, 'This OT room is already booked for that time');

  const op = await OperationSchedule.create(req.body);
  res.status(201).json(new ApiResponse(201, op, 'Operation scheduled'));
});

const listOperations = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const ops = await OperationSchedule.find({ clinicId: { $in: clinics.map((c) => c._id) } })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ date: 1, startTime: 1 });
  res.json(new ApiResponse(200, ops));
});

const updateOperationStatus = asyncHandler(async (req, res) => {
  const op = await OperationSchedule.findById(req.params.id);
  if (!op) throw new ApiError(404, 'Operation not found');
  await assertOwnsClinic(req.user.id, op.clinicId);
  op.status = req.body.status;
  await op.save();
  res.json(new ApiResponse(200, op, 'Operation updated'));
});

module.exports = { scheduleOperation, listOperations, updateOperationStatus };
