const QRCode = require('qrcode');

// Encodes a compact check-in payload as a QR PNG data URL.
// Reception scans it -> frontend calls POST /checkin/verify with this string.
async function generateCheckInQr(appointmentId, token) {
  const payload = `checkin:${appointmentId}:${token}`;
  return QRCode.toDataURL(payload, { margin: 1, width: 240 });
}

module.exports = { generateCheckInQr };
