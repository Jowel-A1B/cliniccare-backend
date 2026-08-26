const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
