const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Document = require('../models/Document');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const doc = await Document.create({
    patientId: patient._id,
    familyMemberId: req.body.familyMemberId || null,
    title: req.body.title || req.file.originalname,
    category: req.body.category || 'other',
    filePath: `/uploads/documents/${req.file.filename}`,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  });

  res.status(201).json(new ApiResponse(201, doc, 'Document uploaded'));
});

// Patients see their own vault; doctors may only look up a patient they
// share a real appointment with (or were explicitly granted access to);
// admins can look up any patient.
const getPatientDocuments = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    const ownPatient = await Patient.findOne({ userId: req.user.id });
    if (!ownPatient || ownPatient._id.toString() !== req.params.patientId) {
      throw new ApiError(403, 'You can only view your own documents');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    const patient = await Patient.findById(req.params.patientId);
    if (!doctor || !patient) throw new ApiError(404, 'Not found');

    const hasAppointment = await Appointment.exists({ doctorId: doctor._id, patientId: patient._id });
    const isShared = patient.sharedWithDoctorIds.some((id) => id.toString() === doctor._id.toString());
    if (!hasAppointment && !isShared) {
      throw new ApiError(403, "You don't have access to this patient's documents");
    }
  }

  const docs = await Document.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, docs));
});

const deleteDocument = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  const doc = await Document.findOne({ _id: req.params.id, patientId: patient._id });
  if (!doc) throw new ApiError(404, 'Document not found');
  await doc.deleteOne();
  res.json(new ApiResponse(200, null, 'Document deleted'));
});

module.exports = { uploadDocument, getPatientDocuments, deleteDocument };
