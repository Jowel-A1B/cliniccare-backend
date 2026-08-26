const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { APPOINTMENT_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { notify } = require('./notificationService');
const { logAudit } = require('./auditService');

// GRACE_MINUTES: how long after the booked slot we wait before assuming the
// patient isn't coming. 30 min is a reasonable clinic default; tune as needed.
const GRACE_MINUTES = 30;

// Runs periodically: any "accepted" appointment whose slot + grace period has
// passed, and which was never checked in via QR, gets auto-marked "no_show".
// This is what makes the no-show risk analytics (analyticsService.js)
// actually fill up with real data over time instead of staying empty forever.
async function runNoShowSweep() {
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const candidates = await Appointment.find({
    status: APPOINTMENT_STATUS.ACCEPTED,
    checkedIn: false,
    date: { $gte: todayStart, $lte: now },
  }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } });

  let flagged = 0;
  for (const appt of candidates) {
    const [h, m] = (appt.timeSlot || '00:00').split(':').map(Number);
    const slotDateTime = new Date(appt.date);
    slotDateTime.setHours(h, m, 0, 0);
    const graceEnd = new Date(slotDateTime.getTime() + GRACE_MINUTES * 60000);

    if (now < graceEnd) continue; // still within grace period, leave it alone

    const before = { status: appt.status };
    appt.status = APPOINTMENT_STATUS.NO_SHOW;
    await appt.save();
    flagged += 1;

    await logAudit({
      userId: appt.patientId?.userId?._id || appt.patientId,
      userRole: 'system',
      action: 'appointment.auto_no_show',
      entityType: 'Appointment',
      entityId: appt._id,
      before,
      after: { status: appt.status },
    });

    if (appt.patientId?.userId) {
      await notify({
        userId: appt.patientId.userId._id,
        userEmail: appt.patientId.userId.email,
        type: NOTIFICATION_TYPE.APPOINTMENT_STATUS_CHANGED,
        subject: 'Missed appointment',
        message: `Your appointment on ${appt.date.toDateString()} at ${appt.timeSlot} was marked as missed (no check-in). Contact the clinic if this is a mistake.`,
      });
    }
  }

  if (flagged > 0) console.log(`[noShowService] Auto-flagged ${flagged} appointment(s) as no_show.`);
}

// Every 15 minutes — frequent enough to feel automatic, cheap enough to not matter.
function startNoShowCron() {
  cron.schedule('*/15 * * * *', runNoShowSweep);
  console.log('[noShowService] No-show sweep cron scheduled (every 15 min).');
}

module.exports = { startNoShowCron, runNoShowSweep };
