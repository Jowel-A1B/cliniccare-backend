const express = require('express');
const router = express.Router();
const {
  symptomCheck,
  matchDoctors,
  receptionChat,
  parseBookingIntent,
  getPatientRiskScore,
  getNoShowRisk,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/symptom-check', protect, allowRoles(ROLES.PATIENT), symptomCheck);
router.post('/match-doctors', protect, allowRoles(ROLES.PATIENT), matchDoctors);
router.post('/chat', receptionChat); // public — FAQ bot, no login needed to ask "what are your hours"
router.post('/parse-booking-intent', protect, allowRoles(ROLES.PATIENT), parseBookingIntent);
router.get('/risk-score/patient/:patientId', protect, allowRoles(ROLES.DOCTOR, ROLES.ADMIN), getPatientRiskScore);
router.get('/no-show-risk/patient/:patientId', protect, allowRoles(ROLES.DOCTOR, ROLES.ADMIN), getNoShowRisk);

module.exports = router;
