const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Ambulance = require('../models/Ambulance');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const { estimateEta } = require('../services/ambulanceService');

async function assertOwnsClinic(userId, clinicId) {
  const clinic = await Clinic.findOne({ _id: clinicId, ownerId: userId });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');
}

const addAmbulance = asyncHandler(async (req, res) => {
  await assertOwnsClinic(req.user.id, req.body.clinicId);
  const amb = await Ambulance.create(req.body);
  res.status(201).json(new ApiResponse(201, amb, 'Ambulance added to fleet'));
});

const listFleet = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const fleet = await Ambulance.find({ clinicId: { $in: clinics.map((c) => c._id) } }).sort({ status: 1 });
  res.json(new ApiResponse(200, fleet));
});

// Patient-facing: find the nearest available ambulance and dispatch it.
const requestAmbulance = asyncHandler(async (req, res) => {
  const { pickupAddress, pickupLat, pickupLng } = req.body;

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const available = await Ambulance.find({ status: 'available' });
  if (available.length === 0) throw new ApiError(409, 'No ambulances available right now');

  // pick the nearest by straight-line distance (heuristic — see ambulanceService.js)
  let nearest = available[0];
  let nearestEta = estimateEta(nearest.location, { lat: pickupLat, lng: pickupLng });
  for (const amb of available.slice(1)) {
    const eta = estimateEta(amb.location, { lat: pickupLat, lng: pickupLng });
    if (eta.distanceKm !== null && (nearestEta.distanceKm === null || eta.distanceKm < nearestEta.distanceKm)) {
      nearest = amb;
      nearestEta = eta;
    }
  }

  nearest.status = 'enroute';
  nearest.currentPatientId = patient._id;
  nearest.pickupAddress = pickupAddress;
  await nearest.save();

  res.status(201).json(new ApiResponse(201, { ambulance: nearest, ...nearestEta }, 'Ambulance dispatched'));
});

const completeDispatch = asyncHandler(async (req, res) => {
  const amb = await Ambulance.findById(req.params.id);
  if (!amb) throw new ApiError(404, 'Ambulance not found');
  await assertOwnsClinic(req.user.id, amb.clinicId);

  amb.status = 'available';
  amb.currentPatientId = null;
  amb.pickupAddress = null;
  await amb.save();
  res.json(new ApiResponse(200, amb, 'Ambulance marked available'));
});

module.exports = { addAmbulance, listFleet, requestAmbulance, completeDispatch };
