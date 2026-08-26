const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const HealthGoal = require('../models/HealthGoal');
const Patient = require('../models/Patient');

const createGoal = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const goal = await HealthGoal.create({ ...req.body, patientId: patient._id });
  res.status(201).json(new ApiResponse(201, goal, 'Goal created'));
});

const getMyGoals = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const goals = await HealthGoal.find({ patientId: patient._id }).populate('familyMemberId', 'name').sort({ createdAt: -1 });
  res.json(new ApiResponse(200, goals));
});

const logProgress = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const goal = await HealthGoal.findOne({ _id: req.params.id, patientId: patient._id });
  if (!goal) throw new ApiError(404, 'Goal not found');

  goal.progressLog.push({ value: req.body.value, date: req.body.date || new Date() });
  await goal.save();
  res.json(new ApiResponse(200, goal, 'Progress logged'));
});

const deleteGoal = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const goal = await HealthGoal.findOne({ _id: req.params.id, patientId: patient._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  await goal.deleteOne();
  res.json(new ApiResponse(200, null, 'Goal removed'));
});

module.exports = { createGoal, getMyGoals, logProgress, deleteGoal };
