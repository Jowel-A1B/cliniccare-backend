const express = require('express');
const router = express.Router();
const { searchDoctors, getDoctorById, updateMyProfile } = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.get('/', searchDoctors); // public search
router.get('/:id', getDoctorById); // public profile view
router.patch('/me/profile', protect, allowRoles(ROLES.DOCTOR), updateMyProfile);

module.exports = router;
