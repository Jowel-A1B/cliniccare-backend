const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const BloodDonor = require('../models/BloodDonor');

const registerDonor = asyncHandler(async (req, res) => {
  const donor = await BloodDonor.create({ ...req.body, userId: req.user?.id || null });
  res.status(201).json(new ApiResponse(201, donor, 'Registered as a donor. Thank you!'));
});

const searchDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, city } = req.query;
  const query = { available: true };
  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (city) query.city = new RegExp(city, 'i');

  const donors = await BloodDonor.find(query).select('name phone bloodGroup city lastDonationDate').sort({ createdAt: -1 });
  res.json(new ApiResponse(200, donors));
});

module.exports = { registerDonor, searchDonors };
