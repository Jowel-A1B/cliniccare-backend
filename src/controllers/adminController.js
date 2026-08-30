const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

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

// --- Doctor account approval ---------------------------------------------
// Self-registered doctors land here as `pending`. Any admin can review them;
// approval activates the underlying User account so the doctor can log in.

const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ approvalStatus: 'pending' })
    .populate('userId', 'name email phone createdAt')
    .populate('specializationId', 'name')
    .sort({ createdAt: 1 });
  res.json(new ApiResponse(200, doctors));
});

const reviewDoctor = asyncHandler(async (req, res) => {
  const { decision, reason } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    throw new ApiError(400, "decision must be 'approved' or 'rejected'");
  }

  const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  if (doctor.approvalStatus !== 'pending') {
    throw new ApiError(409, `This doctor has already been ${doctor.approvalStatus}`);
  }

  const before = { approvalStatus: doctor.approvalStatus };

  doctor.approvalStatus = decision;
  doctor.approvedBy = req.user.id;
  doctor.approvedAt = new Date();
  doctor.rejectionReason = decision === 'rejected' ? reason || null : null;
  await doctor.save();

  // Approval flips the User active; rejection leaves it inactive so the
  // account can't be used, but the record is kept for the audit trail.
  await User.findByIdAndUpdate(doctor.userId._id, { isActive: decision === 'approved' });

  await logAudit({
    userId: req.user.id,
    userRole: req.user.role,
    action: `doctor.${decision}`,
    entityType: 'Doctor',
    entityId: doctor._id,
    before,
    after: { approvalStatus: doctor.approvalStatus },
  });

  await notify({
    userId: doctor.userId._id,
    userEmail: doctor.userId.email,
    type: NOTIFICATION_TYPE.GENERAL,
    subject: `Doctor account ${decision}`,
    message:
      decision === 'approved'
        ? 'Your doctor account has been approved. You can now log in.'
        : `Your doctor account registration was not approved${reason ? `: ${reason}` : '.'}`,
  });

  res.json(new ApiResponse(200, doctor, `Doctor ${decision}`));
});

// Flat patient directory for admin-side pickers (bed assignment, OT, etc.)
// where the admin needs to choose a patient by name rather than paste an id.
const listPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find().populate('userId', 'name phone email').sort({ createdAt: -1 });
  res.json(
    new ApiResponse(
      200,
      patients
        .filter((p) => p.userId)
        .map((p) => ({ _id: p._id, name: p.userId.name, phone: p.userId.phone || '', email: p.userId.email }))
    )
  );
});

module.exports = {
  createClinic,
  getMyClinics,
  getDashboardSummary,
  getPendingDoctors,
  reviewDoctor,
  listPatients,
};
