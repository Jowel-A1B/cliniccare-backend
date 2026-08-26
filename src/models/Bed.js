const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    ward: { type: String, required: true }, // "ICU", "General", "Maternity"...
    bedNumber: { type: String, required: true },
    status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available', index: true },
    currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    notes: String,
  },
  { timestamps: true }
);

bedSchema.index({ clinicId: 1, ward: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
