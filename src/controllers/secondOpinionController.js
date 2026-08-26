const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const SecondOpinionRequest = require('../models/SecondOpinionRequest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { notify } = require('../services/notificationService');
const { NOTIFICATION_TYPE } = require('../utils/constants');

const requestSecondOpinion = asyncHandler(async (req, res) => {
  const { originalAppointmentId, requestedDoctorId, note } = req.body;

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const doctor = await Doctor.findById(requestedDoctorId).populate('userId', 'name email');
  if (!doctor) throw new ApiError(404, 'Requested doctor not found');

  const request = await SecondOpinionRequest.create({
    patientId: patient._id,
    originalAppointmentId,
    requestedDoctorId,
    note,
  });

  // Granting read access to the patient's history is what makes the second
  // opinion actually reviewable — without this the doctor couldn't see anything.
  await Patient.findByIdAndUpdate(patient._id, { $addToSet: { sharedWithDoctorIds: requestedDoctorId } });

  await notify({
    userId: doctor.userId._id,
    userEmail: doctor.userId.email,
    type: NOTIFICATION_TYPE.GENERAL,
    subject: 'Second opinion requested',
    message: `A patient has requested your second opinion on a prior visit.`,
  });

  res.status(201).json(new ApiResponse(201, request, 'Second opinion requested'));
});

const getMyRequestsAsPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const requests = await SecondOpinionRequest.find({ patientId: patient._id })
    .populate({ path: 'requestedDoctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, requests));
});

const getIncomingRequestsAsDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const requests = await SecondOpinionRequest.find({ requestedDoctorId: doctor._id })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, requests));
});

const respondToRequest = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  const request = await SecondOpinionRequest.findOne({ _id: req.params.id, requestedDoctorId: doctor._id }).populate({
    path: 'patientId',
    populate: { path: 'userId', select: 'name email' },
  });
  if (!request) throw new ApiError(404, 'Request not found');

  request.response = req.body.response;
  request.status = 'responded';
  request.respondedAt = new Date();
  await request.save();

  await notify({
    userId: request.patientId.userId._id,
    userEmail: request.patientId.userId.email,
    type: NOTIFICATION_TYPE.GENERAL,
    subject: 'Second opinion received',
    message: `A doctor has responded to your second opinion request.`,
  });

  res.json(new ApiResponse(200, request, 'Response submitted'));
});

module.exports = { requestSecondOpinion, getMyRequestsAsPatient, getIncomingRequestsAsDoctor, respondToRequest };
