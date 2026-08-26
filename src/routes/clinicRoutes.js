const express = require('express');
const router = express.Router();
const Clinic = require('../models/Clinic');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Public listing — used by the patient-facing search/filter UI.
router.get('/', asyncHandler(async (req, res) => {
  const clinics = await Clinic.find();
  res.json(new ApiResponse(200, clinics));
}));

module.exports = router;
