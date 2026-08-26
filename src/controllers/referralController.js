const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Referral = require('../models/Referral');
const Doctor = require('../models/Doctor');
const { notify } = require('../services/notificationService');
const { NOTIFICATION_TYPE } = require('../utils/constants');

const createReferral = asyncHandler(async (req, res) => {
  const { toDoctorId, patientId, reason } = req.body;

  const fromDoctor = await Doctor.findOne({ userId: req.user.id });
  if (!fromDoctor) throw new ApiError(404, 'Doctor profile not found');

  const toDoctor = await Doctor.findById(toDoctorId).populate('userId', 'name email');
  if (!toDoctor) throw new ApiError(404, 'Referred doctor not found');

  const referral = await Referral.create({ fromDoctorId: fromDoctor._id, toDoctorId, patientId, reason });

  await notify({
    userId: toDoctor.userId._id,
    userEmail: toDoctor.userId.email,
    type: NOTIFICATION_TYPE.GENERAL,
    subject: 'New patient referral',
    message: `A colleague has referred a patient to you: ${reason}`,
  });

  res.status(201).json(new ApiResponse(201, referral, 'Referral sent'));
});

const getSentReferrals = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  const referrals = await Referral.find({ fromDoctorId: doctor._id })
    .populate({ path: 'toDoctorId', populate: { path: 'userId', select: 'name' } })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, referrals));
});

const getIncomingReferrals = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  const referrals = await Referral.find({ toDoctorId: doctor._id })
    .populate({ path: 'fromDoctorId', populate: { path: 'userId', select: 'name' } })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, referrals));
});

const acknowledgeReferral = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  const referral = await Referral.findOne({ _id: req.params.id, toDoctorId: doctor._id });
  if (!referral) throw new ApiError(404, 'Referral not found');
  referral.status = 'acknowledged';
  await referral.save();
  res.json(new ApiResponse(200, referral, 'Referral acknowledged'));
});

module.exports = { createReferral, getSentReferrals, getIncomingReferrals, acknowledgeReferral };
