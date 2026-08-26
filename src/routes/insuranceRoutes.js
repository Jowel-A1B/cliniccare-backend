const express = require('express');
const router = express.Router();
const { submitClaim, getMyClaims, getClinicClaims, updateClaimStatus } = require('../controllers/insuranceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.PATIENT), submitClaim);
router.get('/mine', protect, allowRoles(ROLES.PATIENT), getMyClaims);
router.get('/clinic', protect, allowRoles(ROLES.ADMIN), getClinicClaims);
router.patch('/:id/status', protect, allowRoles(ROLES.ADMIN), updateClaimStatus);

module.exports = router;
