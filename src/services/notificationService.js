const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');
const { emitToUser } = require('./socketService');

// Single entry point for all "tell the user something happened" logic.
// V2: every notification is now pushed live over WebSocket in addition to
// being persisted + emailed, so the frontend bell updates without a refresh.
// A real SMS provider (Twilio etc.) would plug in here the same way email does.
async function notify({ userId, userEmail, message, type, subject }) {
  const notification = await Notification.create({ userId, message, type });

  if (userEmail) {
    await sendEmail({ to: userEmail, subject: subject || 'Clinic App Notification', text: message });
  }

  emitToUser(userId, 'notification:new', {
    id: notification._id,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
  });
}

module.exports = { notify };
