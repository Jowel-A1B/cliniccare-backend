const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { streamPrescriptionPdf } = require('../services/pdfService');

const createPrescription = asyncHandler(async (req, res) => {
  const { appointmentId, medicines, testsSuggested, followUpDate } = req.body;

  const doctor = await Doctor.findOne({ userId: req.user.id }).populate('userId', 'name');
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const appointment = await Appointment.findById(appointmentId).populate({
    path: 'patientId',
    populate: { path: 'userId', select: 'name' },
  });
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  // Upsert: re-saving a visit (e.g. the doctor correcting notes on an
  // already-completed appointment) updates the existing prescription rather
  // than failing.
  let prescription = await Prescription.findOne({ appointmentId });
  if (prescription) {
    prescription.medicines = medicines;
    prescription.testsSuggested = testsSuggested;
    prescription.followUpDate = followUpDate;
  } else {
    prescription = new Prescription({
      appointmentId,
      patientId: appointment.patientId._id,
      doctorId: doctor._id,
      familyMemberId: appointment.familyMemberId || null,
      medicines,
      testsSuggested,
      followUpDate,
    });
  }
  await prescription.save();

  // The PDF is generated on demand from this data (see getPrescriptionPdf) —
  // nothing is stored on disk, so it can't go missing on a server restart.
  res.status(201).json(new ApiResponse(201, prescription, 'Prescription created'));
});

async function assertCanViewPrescription(prescription, user) {
  if (user.role === 'admin') return;
  if (user.role === 'patient') {
    const ownPatient = await Patient.findOne({ userId: user.id });
    if (ownPatient && ownPatient._id.toString() === prescription.patientId.toString()) return;
  }
  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: user.id });
    if (doctor && doctor._id.toString() === prescription.doctorId.toString()) return;
  }
  throw new ApiError(403, 'You do not have access to this prescription');
}

const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) throw new ApiError(404, 'Prescription not found');

  // Security fix: previously any logged-in user could fetch any prescription by ID.
  await assertCanViewPrescription(prescription, req.user);

  res.json(new ApiResponse(200, prescription));
});

// Lets the patient/doctor jump straight from an appointment card to its
// prescription (medicines + PDF link) without knowing the prescription's own ID.
const getPrescriptionByAppointment = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({ appointmentId: req.params.appointmentId });
  if (!prescription) return res.json(new ApiResponse(200, null)); // not written yet — not an error

  await assertCanViewPrescription(prescription, req.user);

  res.json(new ApiResponse(200, prescription));
});

// Builds the prescription PDF fresh from the DB and streams it as a download.
// Auth-checked (same rule as viewing the prescription), so the frontend must
// fetch it with the bearer token and save the blob — a plain <a href> can't
// send the header.
const getPrescriptionPdf = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
  if (!prescription) throw new ApiError(404, 'Prescription not found');

  await assertCanViewPrescription(prescription, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="prescription_${prescription._id}.pdf"`);
  streamPrescriptionPdf(res, {
    patientName: prescription.patientId?.userId?.name || 'Patient',
    doctorName: prescription.doctorId?.userId?.name || 'Doctor',
    medicines: prescription.medicines,
    testsSuggested: prescription.testsSuggested,
    followUpDate: prescription.followUpDate,
  });
});

module.exports = { createPrescription, getPrescription, getPrescriptionByAppointment, getPrescriptionPdf };
