const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../utils/constants');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Registers a user and creates the matching role profile in one call.
// Doctor self-registration is allowed here for V1 simplicity; a real deployment
// would likely gate doctor accounts behind admin approval (easy to add later
// since role/profile creation is already isolated in this one function).
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, profile } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  if (![ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, phone, passwordHash, role });

  if (role === ROLES.PATIENT) {
    await Patient.create({ userId: user._id, ...profile });
  } else if (role === ROLES.DOCTOR) {
    if (!profile || !profile.specializationId) {
      throw new ApiError(400, 'Doctor registration requires profile.specializationId');
    }
    await Doctor.create({ userId: user._id, ...profile });
  }
  // role === ADMIN: no extra profile document needed; Clinic.ownerId points back to this user.

  const token = generateToken(user._id, user.role);
  res.status(201).json(
    new ApiResponse(201, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Registered successfully')
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken(user._id, user.role);
  res.json(new ApiResponse(200, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Logged in'));
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(new ApiResponse(200, user));
});

module.exports = { register, login, me };
