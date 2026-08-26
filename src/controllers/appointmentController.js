const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Leave = require('../models/Leave');
const FamilyMember = require('../models/FamilyMember');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { notify } = require('../services/notificationService');
const { computeEffectiveFee } = require('../services/pricingService');
const { logAudit } = require('../services/auditService');
const { isPastCalendarDay, isPastTimeSlotToday } = require('../utils/dateHelpers');

// Patient books an appointment (optionally for a family member). Kept as a
// single flow so V2's payment step can be inserted between "create" and
// "confirm" without a rewrite.
const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, clinicId, date, timeSlot, reason, familyMemberId } = req.body;

  // Server-side guard against booking the past — the frontend also disables
  // these options, but the API must not trust the client alone.
  if (isPastCalendarDay(date)) {
    throw new ApiError(400, 'You cannot book an appointment on a past date');
  }
  if (isPastTimeSlotToday(date, timeSlot)) {
    throw new ApiError(400, 'That time slot has already passed today. Please choose a later time.');
  }

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found for this account');

  if (familyMemberId) {
    const member = await FamilyMember.findOne({ _id: familyMemberId, patientId: patient._id });
    if (!member) throw new ApiError(404, 'Family member not found on this account');
  }

  const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  // V2: block booking on a day the doctor is on leave.
  const onLeave = await Leave.exists({ doctorId, startDate: { $lte: date }, endDate: { $gte: date } });
  if (onLeave) throw new ApiError(409, 'Doctor is on leave that day. Check substitute doctors via /leaves/doctor/:id/availability');

  // Prevent double-booking the same doctor/date/slot (unless previous was rejected/cancelled).
  const clash = await Appointment.findOne({
    doctorId,
    date,
    timeSlot,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED] },
  });
  if (clash) throw new ApiError(409, 'This time slot is no longer available');

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId,
    clinicId,
    date,
    timeSlot,
    reason,
    familyMemberId: familyMemberId || null,
    status: APPOINTMENT_STATUS.PENDING,
    checkInToken: uuidv4(), // V2: used to generate the QR code once accepted
    feeCharged: computeEffectiveFee(doctor, timeSlot), // V4: dynamic pricing snapshot
  });

  await notify({
    userId: doctor.userId._id,
    userEmail: doctor.userId.email,
    type: NOTIFICATION_TYPE.APPOINTMENT_CREATED,
    subject: 'New appointment request',
    message: `You have a new pending appointment on ${date} at ${timeSlot}.`,
  });

  res.status(201).json(new ApiResponse(201, appointment, 'Appointment requested, awaiting confirmation'));
});

const getMyAppointmentsAsPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const appointments = await Appointment.find({ patientId: patient._id })
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'specializationId', select: 'name' }] })
    .populate('clinicId', 'name city address')
    .sort({ date: -1 });

  res.json(new ApiResponse(200, appointments));
});

const getMyAppointmentsAsDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const appointments = await Appointment.find({ doctorId: doctor._id })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
    .populate('clinicId', 'name')
    .sort({ date: 1 });

  res.json(new ApiResponse(200, appointments));
});

// Used by clinic admin dashboard — all appointments across the clinic(s) they own.
const getClinicAppointments = asyncHandler(async (req, res) => {
  const Clinic = require('../models/Clinic');
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const clinicIds = clinics.map((c) => c._id);

  const appointments = await Appointment.find({ clinicId: { $in: clinicIds } })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('clinicId', 'name')
    .sort({ date: -1 });

  res.json(new ApiResponse(200, appointments));
});

// Accept / reject / reschedule / complete / cancel — one endpoint, validated status transitions.
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, date, timeSlot } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate({
    path: 'patientId',
    populate: { path: 'userId', select: 'name email' },
  });
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (status && !Object.values(APPOINTMENT_STATUS).includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const before = { status: appointment.status };

  if (status) appointment.status = status;
  if (date) appointment.date = date;
  if (timeSlot) appointment.timeSlot = timeSlot;
  await appointment.save();

  await logAudit({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'appointment.status_changed',
    entityType: 'Appointment',
    entityId: appointment._id,
    before,
    after: { status: appointment.status },
  });

  await notify({
    userId: appointment.patientId.userId._id,
    userEmail: appointment.patientId.userId.email,
    type: NOTIFICATION_TYPE.APPOINTMENT_STATUS_CHANGED,
    subject: 'Your appointment status has changed',
    message: `Your appointment on ${appointment.date.toDateString()} at ${appointment.timeSlot} is now: ${appointment.status}.`,
  });

  res.json(new ApiResponse(200, appointment, 'Appointment updated'));
});

module.exports = {
  createAppointment,
  getMyAppointmentsAsPatient,
  getMyAppointmentsAsDoctor,
  getClinicAppointments,
  updateAppointmentStatus,
};
