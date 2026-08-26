const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { getAiProvider, DISCLAIMER } = require('../services/aiService');
const { computePatientRiskScore, computeNoShowRisk } = require('../services/analyticsService');
const Doctor = require('../models/Doctor');
const Specialization = require('../models/Specialization');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');

// Maps free-text symptoms to a likely specialization using the same
// specialization list already in the DB — keeps the AI's suggestion always
// bookable (it can only recommend a specialization that actually exists).
const symptomCheck = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, 'Please describe your symptoms first');

  const specs = await Specialization.find().select('name');
  const specNames = specs.map((s) => s.name).join(', ');

  const provider = getAiProvider();
  const system =
    `You are a triage assistant for a Bangladeshi clinic app. Given a patient's symptoms, ` +
    `suggest 2-3 possible general causes (in plain language, non-alarming) and ONE specialization ` +
    `to book from this exact list: ${specNames}. Always end with: "${DISCLAIMER}" ` +
    `Keep the whole answer under 120 words.`;

  const answer = await provider.complete(text, system);

  // Best-effort: find a specialization name mentioned in the AI's answer so
  // the frontend can deep-link straight into search results.
  const matchedSpec = specs.find((s) => answer.toLowerCase().includes(s.name.toLowerCase()));

  res.json(new ApiResponse(200, { answer, suggestedSpecializationId: matchedSpec?._id || null, suggestedSpecializationName: matchedSpec?.name || null }));
});

// Symptom check + immediately return matching doctors for that specialization,
// sorted by rating — this is the "smart doctor matching" feature.
const matchDoctors = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, 'Please describe your symptoms first');

  const specs = await Specialization.find().select('name');
  const specNames = specs.map((s) => s.name).join(', ');
  const provider = getAiProvider();
  const system =
    `Pick exactly ONE specialization from this list that best matches the symptoms: ${specNames}. ` +
    `Reply with ONLY the specialization name, nothing else.`;
  const raw = await provider.complete(text, system);

  const matchedSpec = specs.find((s) => raw.toLowerCase().includes(s.name.toLowerCase())) || specs[0];

  const doctors = await Doctor.find({ specializationId: matchedSpec._id, isAvailable: true })
    .populate('userId', 'name')
    .populate('specializationId', 'name')
    .populate('clinicIds', 'name city')
    .sort({ ratingAvg: -1, experienceYears: -1 })
    .limit(5);

  res.json(new ApiResponse(200, { specialization: matchedSpec.name, doctors }));
});

// Reception FAQ chatbot — grounded with real clinic/doctor data so it
// doesn't invent fees or hours.
const receptionChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) throw new ApiError(400, 'Message is required');

  const clinics = await Clinic.find().limit(5);
  const doctors = await Doctor.find().populate('userId', 'name').populate('specializationId', 'name').limit(10);

  const context = [
    'Clinics: ' + clinics.map((c) => `${c.name} (${c.city})`).join('; '),
    'Doctors: ' + doctors.map((d) => `${d.userId?.name} - ${d.specializationId?.name} - fee ৳${d.consultationFee}`).join('; '),
  ].join('\n');

  const provider = getAiProvider();
  const system =
    `You are the front-desk assistant for a clinic booking app. Answer ONLY using this data — ` +
    `if you don't know, say so and suggest using the search page:\n${context}\n` +
    `Keep answers under 80 words, friendly and concise.`;

  const answer = await provider.complete(message, system);
  res.json(new ApiResponse(200, { answer }));
});

// Parses a free-text (or voice-transcribed) booking request into a
// structured search intent. The frontend uses this to prefill the doctor
// search page rather than booking blind — safer than fully autonomous booking.
const parseBookingIntent = asyncHandler(async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) throw new ApiError(400, 'transcript is required');

  const specs = await Specialization.find().select('name');
  const specNames = specs.map((s) => s.name).join(', ');

  const provider = getAiProvider();
  const system =
    `Extract a doctor search intent from the user's spoken request. Reply with ONLY compact JSON, ` +
    `no prose, in this exact shape: {"specialization": "<one of: ${specNames}, or null>", ` +
    `"city": "<city mentioned or null>", "timeHint": "<e.g. 'tomorrow evening' or null>"}`;

  const raw = await provider.complete(transcript, system);

  let parsed = { specialization: null, city: null, timeHint: null };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // fall back to the empty/default intent above — never throw on a parse miss
  }

  const matchedSpec = specs.find((s) => (parsed.specialization || '').toLowerCase() === s.name.toLowerCase());

  res.json(new ApiResponse(200, { ...parsed, specializationId: matchedSpec?._id || null, transcript }));
});

const getPatientRiskScore = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) throw new ApiError(404, 'Patient not found');

  const records = await MedicalRecord.find({ patientId: patient._id });
  const result = computePatientRiskScore(records, patient);
  res.json(new ApiResponse(200, result));
});

const getNoShowRisk = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) throw new ApiError(404, 'Patient not found');

  const appointments = await Appointment.find({ patientId: patient._id }).sort({ date: -1 });
  const result = computeNoShowRisk(appointments);
  res.json(new ApiResponse(200, result));
});

module.exports = { symptomCheck, matchDoctors, receptionChat, parseBookingIntent, getPatientRiskScore, getNoShowRisk };
