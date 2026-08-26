const mongoose = require('mongoose');

// A dependent profile under one patient account (father/mother/child/etc.)
// so one login can manage the whole family's appointments and records.
const familyMemberSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true, trim: true },
    relation: { type: String, enum: ['self', 'father', 'mother', 'spouse', 'child', 'other'], required: true },
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
