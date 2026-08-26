const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const FamilyMember = require('../models/FamilyMember');
const Patient = require('../models/Patient');

const addFamilyMember = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const member = await FamilyMember.create({ ...req.body, patientId: patient._id });
  res.status(201).json(new ApiResponse(201, member, 'Family member added'));
});

const getMyFamilyMembers = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const members = await FamilyMember.find({ patientId: patient._id }).sort({ createdAt: 1 });
  res.json(new ApiResponse(200, members));
});

const deleteFamilyMember = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const member = await FamilyMember.findOne({ _id: req.params.id, patientId: patient._id });
  if (!member) throw new ApiError(404, 'Family member not found');
  await member.deleteOne();
  res.json(new ApiResponse(200, null, 'Family member removed'));
});

module.exports = { addFamilyMember, getMyFamilyMembers, deleteFamilyMember };
