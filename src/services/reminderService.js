const cron = require('node-cron');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { notify } = require('./notificationService');
const { NOTIFICATION_TYPE } = require('../utils/constants');

// Runs once a day: finds prescriptions whose follow-up date is tomorrow and
// notifies the patient. Kept as its own module so V3 (SMS/voice reminders)
// only has to touch this one file.
async function runFollowUpReminderCheck() {
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const due = await Prescription.find({ followUpDate: { $gte: tomorrowStart, $lte: tomorrowEnd } });

  for (const presc of due) {
    const patient = await Patient.findById(presc.patientId);
    if (!patient) continue;
    const user = await User.findById(patient.userId);
    if (!user) continue;

    await notify({
      userId: user._id,
      userEmail: user.email,
      type: NOTIFICATION_TYPE.GENERAL,
      subject: 'Follow-up reminder',
      message: `Reminder: your follow-up appointment is due tomorrow (${presc.followUpDate.toDateString()}).`,
    });
  }

  console.log(`[reminderService] Checked follow-ups, notified ${due.length} patient(s).`);
}

// Runs every day at 8:00 AM server time.
function startReminderCron() {
  cron.schedule('0 8 * * *', runFollowUpReminderCheck);
  console.log('[reminderService] Follow-up reminder cron scheduled (daily 08:00).');
}

module.exports = { startReminderCron, runFollowUpReminderCheck };
