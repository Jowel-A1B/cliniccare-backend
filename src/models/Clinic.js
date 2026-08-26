const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: String,
    city: { type: String, index: true }, // e.g. Dhaka, Dinajpur - used for location filter
    location: {
      lat: Number,
      lng: Number,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contactNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clinic', clinicSchema);
