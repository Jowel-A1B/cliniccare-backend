const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    vehicleNumber: { type: String, required: true },
    driverName: String,
    driverPhone: String,
    status: { type: String, enum: ['available', 'enroute', 'busy'], default: 'available', index: true },
    location: { lat: Number, lng: Number }, // current position, updated on dispatch
    currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    pickupAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ambulance', ambulanceSchema);
