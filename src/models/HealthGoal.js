const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema(
  { date: { type: Date, default: Date.now }, value: { type: Number, required: true } },
  { _id: false }
);

// Preventive-health tracking (not tied to an illness) — also doubles as the
// "elderly care" use case when set on a FamilyMember (e.g. "Father's step count").
const healthGoalSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
    goalType: { type: String, enum: ['weight', 'steps', 'water', 'custom'], required: true },
    label: String, // for goalType "custom"
    target: { type: Number, required: true },
    unit: { type: String, required: true }, // "kg", "steps", "L"
    progressLog: [progressEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthGoal', healthGoalSchema);
