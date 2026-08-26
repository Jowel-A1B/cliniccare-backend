const express = require('express');
const router = express.Router();
const Specialization = require('../models/Specialization');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const list = await Specialization.find().sort({ name: 1 });
  res.json(new ApiResponse(200, list));
}));

module.exports = router;
