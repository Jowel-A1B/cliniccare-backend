// Haversine distance + a flat average-speed assumption for a rough ETA.
// HONESTY NOTE: this is not real GPS tracking — there's no live vehicle
// telemetry here. It's the same shape a real tracking integration would
// return (distanceKm + etaMinutes), so swapping in a real telematics API
// later doesn't change any caller.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AVERAGE_SPEED_KMH = 30; // rough city-traffic assumption

function estimateEta(ambulanceLocation, pickupLocation) {
  if (!ambulanceLocation?.lat || !pickupLocation?.lat) return { distanceKm: null, etaMinutes: null };
  const distanceKm = haversineKm(ambulanceLocation.lat, ambulanceLocation.lng, pickupLocation.lat, pickupLocation.lng);
  const etaMinutes = Math.max(2, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
  return { distanceKm: Number(distanceKm.toFixed(1)), etaMinutes };
}

module.exports = { estimateEta };
