const nodemailer = require('nodemailer');
const env = require('../config/env');

// If SMTP isn't configured (common in local dev), we log instead of throwing —
// so the booking flow never breaks just because email isn't set up yet.
let transporter = null;
if (env.smtp.host && env.smtp.user) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: Number(env.smtp.port) || 587,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`[emailService] (dev mode, no SMTP configured) Would send email to ${to}: ${subject}`);
    return { simulated: true };
  }
  return transporter.sendMail({ from: env.smtp.from, to, subject, text, html });
}

module.exports = { sendEmail };
