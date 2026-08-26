const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Patient = require('../models/Patient');

const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id }).populate('userId', 'name email phone');
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.json(new ApiResponse(200, patient));
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOneAndUpdate({ userId: req.user.id }, req.body, { new: true });
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.json(new ApiResponse(200, patient, 'Profile updated'));
});

// V3: doctor notes sharing permission — patient controls which doctors
// (beyond those they've had a direct appointment with) can view their history.
const getSharingPermissions = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id }).populate({
    path: 'sharedWithDoctorIds',
    populate: [{ path: 'userId', select: 'name' }, { path: 'specializationId', select: 'name' }],
  });
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.json(new ApiResponse(200, patient.sharedWithDoctorIds));
});

const grantSharingPermission = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  const patient = await Patient.findOneAndUpdate(
    { userId: req.user.id },
    { $addToSet: { sharedWithDoctorIds: doctorId } },
    { new: true }
  );
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.json(new ApiResponse(200, patient, 'Access granted'));
});

const revokeSharingPermission = asyncHandler(async (req, res) => {
  const patient = await Patient.findOneAndUpdate(
    { userId: req.user.id },
    { $pull: { sharedWithDoctorIds: req.params.doctorId } },
    { new: true }
  );
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.json(new ApiResponse(200, patient, 'Access revoked'));
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getSharingPermissions,
  grantSharingPermission,
  revokeSharingPermission,
};
