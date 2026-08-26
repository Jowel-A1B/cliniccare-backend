const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Doctor = require('../models/Doctor');

// Search + filter: specialization, city, gender(via user later if needed), fee range, min rating.
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization, city, maxFee, minRating, clinicId } = req.query;

  const query = { isAvailable: true };
  if (specialization) query.specializationId = specialization;
  if (clinicId) query.clinicIds = clinicId;
  if (maxFee) query.consultationFee = { $lte: Number(maxFee) };
  if (minRating) query.ratingAvg = { $gte: Number(minRating) };

  let doctors = await Doctor.find(query)
    .populate('userId', 'name email phone')
    .populate('specializationId', 'name')
    .populate('clinicIds', 'name city address');

  if (city) {
    doctors = doctors.filter((d) => d.clinicIds.some((c) => c.city && c.city.toLowerCase() === city.toLowerCase()));
  }

  res.json(new ApiResponse(200, doctors));
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('specializationId', 'name')
    .populate('clinicIds', 'name city address location');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json(new ApiResponse(200, doctor));
});

// Doctor updates their own availability / fee / bio.
const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOneAndUpdate({ userId: req.user.id }, req.body, { new: true });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  res.json(new ApiResponse(200, doctor, 'Profile updated'));
});

module.exports = { searchDoctors, getDoctorById, updateMyProfile };
