const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../utils/constants');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Registers a user and creates the matching role profile in one call.
//
// - Patients are activated immediately and get a session token back.
// - Doctors are created in a `pending` state: the User is inactive and no
//   token is issued. A clinic admin must approve the account (see
//   adminController.reviewDoctor) before the doctor can log in.
// - Admins can NOT be self-registered — that role is provisioned only via
//   the seed script / direct DB access, so a stranger can't grant themselves
//   admin powers just by picking "admin" on the signup form.
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, profile } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  if (role === ROLES.ADMIN) {
    throw new ApiError(403, 'Admin accounts cannot be self-registered');
  }
  if (![ROLES.PATIENT, ROLES.DOCTOR].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  if (role === ROLES.DOCTOR && (!profile || !profile.specializationId)) {
    throw new ApiError(400, 'Doctor registration requires profile.specializationId');
  }

  const passwordHash = await User.hashPassword(password);
  // Doctors stay inactive until an admin approves them.
  const isActive = role !== ROLES.DOCTOR;
  const user = await User.create({ name, email, phone, passwordHash, role, isActive });

  if (role === ROLES.PATIENT) {
    await Patient.create({ userId: user._id, ...profile });

    const token = generateToken(user._id, user.role);
    return res.status(201).json(
      new ApiResponse(
        201,
        { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
        'Registered successfully'
      )
    );
  }

  // role === ROLES.DOCTOR — create the profile as pending, issue no token.
  await Doctor.create({ userId: user._id, ...profile, approvalStatus: 'pending' });
  res.status(201).json(
    new ApiResponse(
      201,
      { pendingApproval: true },
      'Registration submitted. A clinic admin will review your account — you can log in once it is approved.'
    )
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  // A doctor whose account is still pending / rejected must not get a session.
  if (user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: user._id }).select('approvalStatus rejectionReason');
    if (doctor?.approvalStatus === 'pending') {
      throw new ApiError(403, 'Your doctor account is awaiting admin approval. Please try again once it is approved.');
    }
    if (doctor?.approvalStatus === 'rejected') {
      throw new ApiError(
        403,
        `Your doctor account registration was not approved${doctor.rejectionReason ? `: ${doctor.rejectionReason}` : '.'}`
      );
    }
  }

  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Contact the clinic administrator.');

  const token = generateToken(user._id, user.role);
  res.json(new ApiResponse(200, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Logged in'));
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(new ApiResponse(200, user));
});

module.exports = { register, login, me };
