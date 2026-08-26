const express = require('express');
const router = express.Router();
const { createPrescription, getPrescription, getPrescriptionByAppointment } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.DOCTOR), createPrescription);
router.get('/appointment/:appointmentId', protect, getPrescriptionByAppointment);
router.get('/:id', protect, getPrescription);

module.exports = router;
