const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Document = require('../models/Document');
const Patient = require('../models/Patient');

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

// Patients see their own vault; doctors/admins can look up by patientId
// (in a real deployment you'd also check a shared-appointment relationship
// here the same way messageController does).
const getPatientDocuments = asyncHandler(async (req, res) => {
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
