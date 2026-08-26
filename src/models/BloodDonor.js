const mongoose = require('mongoose');

// City-based, clinic-agnostic donor registry — anyone (patient or not) can
// register as a donor; searchable by blood group + city for emergencies.
const bloodDonorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional link if a registered patient
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bloodGroup: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    lastDonationDate: Date,
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);
