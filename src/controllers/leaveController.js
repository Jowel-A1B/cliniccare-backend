const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Leave = require('../models/Leave');
const Doctor = require('../models/Doctor');

const setLeave = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const { startDate, endDate, reason } = req.body;
  const leave = await Leave.create({ doctorId: doctor._id, startDate, endDate, reason });
  res.status(201).json(new ApiResponse(201, leave, 'Leave scheduled'));
});

const getMyLeaves = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  const leaves = await Leave.find({ doctorId: doctor._id }).sort({ startDate: 1 });
  res.json(new ApiResponse(200, leaves));
});

const cancelLeave = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  const leave = await Leave.findOne({ _id: req.params.id, doctorId: doctor._id });
  if (!leave) throw new ApiError(404, 'Leave not found');
  await leave.deleteOne();
  res.json(new ApiResponse(200, null, 'Leave cancelled'));
});

// Used by the booking page: is this doctor on leave for `date`? If so,
// suggest other available doctors with the same specialization + clinic.
const checkAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const doctor = await Doctor.findById(req.params.doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const target = new Date(date);
  const onLeave = await Leave.exists({
    doctorId: doctor._id,
    startDate: { $lte: target },
    endDate: { $gte: target },
  });

  let substitutes = [];
  if (onLeave) {
    substitutes = await Doctor.find({
      _id: { $ne: doctor._id },
      specializationId: doctor.specializationId,
      clinicIds: { $in: doctor.clinicIds },
      isAvailable: true,
      approvalStatus: { $nin: ['pending', 'rejected'] },
    })
      .populate('userId', 'name')
      .populate('specializationId', 'name');
  }

  res.json(new ApiResponse(200, { onLeave: !!onLeave, substitutes }));
});

module.exports = { setLeave, getMyLeaves, cancelLeave, checkAvailability };
