const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointmentsAsPatient,
  getMyAppointmentsAsDoctor,
  getClinicAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { createAppointmentRules, updateStatusRules } = require('../validators/appointmentValidator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.PATIENT), createAppointmentRules, validate, createAppointment);
router.get('/mine/patient', protect, allowRoles(ROLES.PATIENT), getMyAppointmentsAsPatient);
router.get('/mine/doctor', protect, allowRoles(ROLES.DOCTOR), getMyAppointmentsAsDoctor);
router.get('/clinic', protect, allowRoles(ROLES.ADMIN), getClinicAppointments);
router.patch(
  '/:id/status',
  protect,
  allowRoles(ROLES.ADMIN, ROLES.DOCTOR),
  updateStatusRules,
  validate,
  updateAppointmentStatus
);

module.exports = router;
