const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Appointment = require('../models/Appointment');
const { generateCheckInQr } = require('../services/qrService');
const { isSameCalendarDay } = require('../utils/dateHelpers');

// Patient (or admin viewing on their behalf) fetches the QR image for an
// upcoming accepted appointment, to show at reception.
const getQrCode = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate('patientId', 'userId');
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (!appointment.checkInToken) throw new ApiError(400, 'This appointment has no check-in token');

  // Security fix: previously any logged-in user could fetch any appointment's
  // QR just by guessing its ID. Only the owning patient or an admin may view it.
  const isOwner = appointment.patientId?.userId?.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this appointment');
  }

  const qrDataUrl = await generateCheckInQr(appointment._id, appointment.checkInToken);
  res.json(new ApiResponse(200, { qrDataUrl, date: appointment.date, timeSlot: appointment.timeSlot }));
});

// Reception/admin scans (or manually enters) the QR payload to check the
// patient in — skips the front-desk queue lookup entirely.
const verifyCheckIn = asyncHandler(async (req, res) => {
  const { payload } = req.body; // "checkin:<appointmentId>:<token>"
  const parts = (payload || '').split(':');
  if (parts.length !== 3 || parts[0] !== 'checkin') throw new ApiError(400, 'Invalid QR payload');

  const [, appointmentId, token] = parts;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.checkInToken !== token) throw new ApiError(400, 'Check-in token mismatch');
  if (appointment.status !== 'accepted') throw new ApiError(400, `Appointment is ${appointment.status}, cannot check in`);

  // Security fix: previously any date's QR would check in successfully.
  // A QR is only valid on the actual appointment day.
  if (!isSameCalendarDay(appointment.date, new Date())) {
    throw new ApiError(
      400,
      `This QR is for ${appointment.date.toDateString()}, not today. Check-in is only allowed on the appointment date.`
    );
  }

  appointment.checkedIn = true;
  appointment.checkedInAt = new Date();
  await appointment.save();

  res.json(new ApiResponse(200, appointment, 'Patient checked in'));
});

module.exports = { getQrCode, verifyCheckIn };
