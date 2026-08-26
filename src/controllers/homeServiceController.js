const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const HomeServiceRequest = require('../models/HomeServiceRequest');
const Patient = require('../models/Patient');

const createRequest = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const request = await HomeServiceRequest.create({ ...req.body, patientId: patient._id });
  res.status(201).json(new ApiResponse(201, request, 'Home service requested'));
});

const getMyRequests = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const requests = await HomeServiceRequest.find({ patientId: patient._id }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, requests));
});

// Admin-wide queue (no clinic scoping — home service isn't tied to one clinic).
const getAllRequests = asyncHandler(async (req, res) => {
  const requests = await HomeServiceRequest.find()
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, requests));
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const request = await HomeServiceRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found');
  request.status = req.body.status;
  await request.save();
  res.json(new ApiResponse(200, request, 'Request updated'));
});

module.exports = { createRequest, getMyRequests, getAllRequests, updateRequestStatus };
