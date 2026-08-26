const express = require('express');
const router = express.Router();
const { setLeave, getMyLeaves, cancelLeave, checkAvailability } = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.DOCTOR), setLeave);
router.get('/mine', protect, allowRoles(ROLES.DOCTOR), getMyLeaves);
router.delete('/:id', protect, allowRoles(ROLES.DOCTOR), cancelLeave);
router.get('/doctor/:doctorId/availability', checkAvailability); // public — used during booking

module.exports = router;
