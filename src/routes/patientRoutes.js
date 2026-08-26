const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getSharingPermissions,
  grantSharingPermission,
  revokeSharingPermission,
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.get('/me', protect, allowRoles(ROLES.PATIENT), getMyProfile);
router.patch('/me', protect, allowRoles(ROLES.PATIENT), updateMyProfile);

// V3: doctor notes sharing permission
router.get('/me/sharing', protect, allowRoles(ROLES.PATIENT), getSharingPermissions);
router.post('/me/sharing', protect, allowRoles(ROLES.PATIENT), grantSharingPermission);
router.delete('/me/sharing/:doctorId', protect, allowRoles(ROLES.PATIENT), revokeSharingPermission);

module.exports = router;
