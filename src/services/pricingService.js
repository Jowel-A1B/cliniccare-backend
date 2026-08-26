// V4 dynamic pricing — simple, transparent rule: evening slots (17:00+) use
// peakHourFee if the doctor has set one. A real system might factor in
// demand/occupancy; this is the seam where that logic would go.
function computeEffectiveFee(doctor, timeSlot) {
  const hour = parseInt((timeSlot || '00:00').split(':')[0], 10);
  const isPeak = hour >= 17;
  if (isPeak && doctor.peakHourFee) return doctor.peakHourFee;
  return doctor.consultationFee;
}

module.exports = { computeEffectiveFee };
