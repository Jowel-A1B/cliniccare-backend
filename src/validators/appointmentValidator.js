const { body } = require('express-validator');

const createAppointmentRules = [
  body('doctorId').notEmpty().withMessage('doctorId is required'),
  body('clinicId').notEmpty().withMessage('clinicId is required'),
  body('date').isISO8601().withMessage('date must be a valid date'),
  body('timeSlot').notEmpty().withMessage('timeSlot is required'),
];

const updateStatusRules = [
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'no_show']),
];

module.exports = { createAppointmentRules, updateStatusRules };
