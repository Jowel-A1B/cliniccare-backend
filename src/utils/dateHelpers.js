// Small date helpers shared by booking validation, QR check-in, and the
// no-show cron — kept in one place so "what counts as today" / "has this
// slot passed" logic can't drift between call sites.

function isSameCalendarDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isPastCalendarDay(date) {
  const target = new Date(date);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return target < today;
}

// True if `date` is today AND `timeSlot` ("HH:MM") has already passed.
function isPastTimeSlotToday(date, timeSlot) {
  if (!isSameCalendarDay(date, new Date())) return false;
  const [h, m] = (timeSlot || '00:00').split(':').map(Number);
  const slotDateTime = new Date();
  slotDateTime.setHours(h, m, 0, 0);
  return slotDateTime < new Date();
}

module.exports = { isSameCalendarDay, isPastCalendarDay, isPastTimeSlotToday };
