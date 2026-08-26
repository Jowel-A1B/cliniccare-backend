const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const createReview = asyncHandler(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.patientId.toString() !== patient._id.toString()) {
    throw new ApiError(403, 'This appointment does not belong to you');
  }
  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    throw new ApiError(400, 'You can only review completed appointments');
  }

  const review = await Review.create({
    patientId: patient._id,
    doctorId: appointment.doctorId,
    appointmentId,
    rating,
    comment,
  });

  // Recompute running average rating on the doctor profile.
  const doctor = await Doctor.findById(appointment.doctorId);
  const newCount = doctor.ratingCount + 1;
  const newAvg = (doctor.ratingAvg * doctor.ratingCount + rating) / newCount;
  doctor.ratingCount = newCount;
  doctor.ratingAvg = Number(newAvg.toFixed(2));
  await doctor.save();

  res.status(201).json(new ApiResponse(201, review, 'Review submitted'));
});

const getDoctorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctorId: req.params.doctorId })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, reviews));
});

module.exports = { createReview, getDoctorReviews };
