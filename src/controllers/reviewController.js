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

  const already = await Review.findOne({ appointmentId });
  if (already) throw new ApiError(409, 'You have already reviewed this visit');

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

// Public: every review left for a doctor, newest first — shown on the
// doctor's public profile page.
const getDoctorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctorId: req.params.doctorId })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, reviews));
});

// The logged-in doctor's own reviews, so they can see patient feedback from
// their dashboard (there's no public "as this doctor" lookup otherwise).
const getMyReviewsAsDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const reviews = await Review.find({ doctorId: doctor._id })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, reviews));
});

// One appointment's review (or null). Lets the patient see the review they
// left on that visit's card, and the doctor see it against that visit.
const getReviewByAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient || patient._id.toString() !== appointment.patientId.toString()) {
      throw new ApiError(403, 'This appointment does not belong to you');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
      throw new ApiError(403, 'This appointment does not belong to you');
    }
  }

  const review = await Review.findOne({ appointmentId: req.params.appointmentId }).populate({
    path: 'patientId',
    populate: { path: 'userId', select: 'name' },
  });
  res.json(new ApiResponse(200, review)); // null until the patient reviews the visit
});

module.exports = { createReview, getDoctorReviews, getMyReviewsAsDoctor, getReviewByAppointment };
