const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const createClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(new ApiResponse(201, clinic, 'Clinic created'));
});

const getMyClinics = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id });
  res.json(new ApiResponse(200, clinics));
});

// Quick numbers for the admin dashboard header (today's appointments, revenue proxy, etc.)
const getDashboardSummary = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const clinicIds = clinics.map((c) => c._id);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [todayCount, pendingCount, totalDoctors, totalAppointments] = await Promise.all([
    Appointment.countDocuments({ clinicId: { $in: clinicIds }, date: { $gte: startOfToday, $lte: endOfToday } }),
    Appointment.countDocuments({ clinicId: { $in: clinicIds }, status: APPOINTMENT_STATUS.PENDING }),
    Doctor.countDocuments({ clinicIds: { $in: clinicIds } }),
    Appointment.countDocuments({ clinicId: { $in: clinicIds } }),
  ]);

  res.json(
    new ApiResponse(200, {
      todaysAppointments: todayCount,
      pendingRequests: pendingCount,
      totalDoctors,
      totalAppointments,
    })
  );
});

module.exports = { createClinic, getMyClinics, getDashboardSummary };
