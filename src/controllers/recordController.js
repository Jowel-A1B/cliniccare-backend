const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const { APPOINTMENT_STATUS } = require('../utils/constants');

// Doctor writes a diagnosis/notes entry for a completed (or in-progress) appointment.
const createRecord = asyncHandler(async (req, res) => {
  const { appointmentId, diagnosis, notes } = req.body;

  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.doctorId.toString() !== doctor._id.toString()) {
    throw new ApiError(403, 'This appointment does not belong to you');
  }

  const record = await MedicalRecord.create({
    patientId: appointment.patientId,
    doctorId: doctor._id,
    appointmentId,
    familyMemberId: appointment.familyMemberId || null,
    diagnosis,
    notes,
  });

  // Marking the visit completed here keeps the doctor's flow to one action;
  // can be split into a separate step later if needed.
  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  await appointment.save();

  // Auto-generate the consultation invoice so the patient has a bill to pay
  // right after the diagnosis — without waiting for an admin to raise one.
  // Admin billing can still add extra line items as a separate invoice.
  const fee = appointment.feeCharged || 0;
  if (fee > 0) {
    const alreadyBilled = await Invoice.exists({ appointmentId });
    if (!alreadyBilled) {
      await Invoice.create({
        appointmentId,
        patientId: appointment.patientId,
        clinicId: appointment.clinicId,
        items: [{ label: 'Consultation Fee', amount: fee }],
        total: fee,
      });
    }
  }

  res.status(201).json(new ApiResponse(201, record, 'Medical record saved'));
});

// Full history for a patient — used by both the doctor (during visit) and the patient (My Records).
// V3: a doctor may view it only if they share a direct appointment with the
// patient, OR the patient explicitly granted access (e.g. for a second opinion).
const getPatientHistory = asyncHandler(async (req, res) => {
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    const patient = await Patient.findById(req.params.patientId);
    if (!doctor || !patient) throw new ApiError(404, 'Not found');

    const hasAppointment = await Appointment.exists({ doctorId: doctor._id, patientId: patient._id });
    const isShared = patient.sharedWithDoctorIds.some((id) => id.toString() === doctor._id.toString());

    if (!hasAppointment && !isShared) {
      throw new ApiError(403, "You don't have access to this patient's history yet");
    }
  }

  // Security fix: a patient could previously pass ANY patientId in the URL
  // and read someone else's records. Now they may only fetch their own.
  if (req.user.role === 'patient') {
    const ownPatient = await Patient.findOne({ userId: req.user.id });
    if (!ownPatient || ownPatient._id.toString() !== req.params.patientId) {
      throw new ApiError(403, 'You can only view your own medical history');
    }
  }

  const records = await MedicalRecord.find({ patientId: req.params.patientId })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ date: -1 });
  res.json(new ApiResponse(200, records));
});

// Single record for one appointment — lets the patient/doctor jump straight
// to "what did the doctor say at this specific visit" from an appointment card,
// instead of digging through the whole timeline.
const getRecordByAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (req.user.role === 'patient') {
    const ownPatient = await Patient.findOne({ userId: req.user.id });
    if (!ownPatient || ownPatient._id.toString() !== appointment.patientId.toString()) {
      throw new ApiError(403, 'This appointment does not belong to you');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
      throw new ApiError(403, 'This appointment does not belong to you');
    }
  }

  const record = await MedicalRecord.findOne({ appointmentId: req.params.appointmentId }).populate({
    path: 'doctorId',
    populate: { path: 'userId', select: 'name' },
  });
  res.json(new ApiResponse(200, record)); // null if the doctor hasn't written one yet — not an error
});

module.exports = { createRecord, getPatientHistory, getRecordByAppointment };
