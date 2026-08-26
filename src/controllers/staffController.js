const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Staff = require('../models/Staff');
const Clinic = require('../models/Clinic');

async function assertOwnsClinic(userId, clinicId) {
  const clinic = await Clinic.findOne({ _id: clinicId, ownerId: userId });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');
}

const addStaff = asyncHandler(async (req, res) => {
  await assertOwnsClinic(req.user.id, req.body.clinicId);
  const staff = await Staff.create(req.body);
  res.status(201).json(new ApiResponse(201, staff, 'Staff member added'));
});

const listStaff = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const staff = await Staff.find({ clinicId: { $in: clinics.map((c) => c._id) } }).sort({ role: 1, name: 1 });
  res.json(new ApiResponse(200, staff));
});

const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw new ApiError(404, 'Staff member not found');
  await assertOwnsClinic(req.user.id, staff.clinicId);
  await staff.deleteOne();
  res.json(new ApiResponse(200, null, 'Staff member removed'));
});

module.exports = { addStaff, listStaff, deleteStaff };
