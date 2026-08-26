const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], required: true },
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true }, // "18:00"
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specializationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialization', required: true, index: true },
    clinicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }],
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0, index: true },
    // V4: dynamic pricing — if set, bookings in the evening (17:00+) charge
    // this instead of consultationFee. See services/pricingService.js.
    peakHourFee: { type: Number, default: null },
    bio: String,
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    availability: [availabilitySchema],
    isAvailable: { type: Boolean, default: true }, // toggled off for V2 leave-management
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
