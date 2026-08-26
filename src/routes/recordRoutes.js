const express = require('express');
const router = express.Router();
const { createRecord, getPatientHistory, getRecordByAppointment } = require('../controllers/recordController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.DOCTOR), createRecord);
router.get('/patient/:patientId', protect, allowRoles(ROLES.DOCTOR, ROLES.PATIENT, ROLES.ADMIN), getPatientHistory);
router.get('/appointment/:appointmentId', protect, getRecordByAppointment);

module.exports = router;
