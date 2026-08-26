const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), default: NOTIFICATION_TYPE.GENERAL },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
