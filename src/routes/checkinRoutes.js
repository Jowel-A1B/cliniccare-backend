const express = require('express');
const router = express.Router();
const { getQrCode, verifyCheckIn } = require('../controllers/checkinController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.get('/:id/qrcode', protect, getQrCode);
router.post('/verify', protect, allowRoles(ROLES.ADMIN, ROLES.DOCTOR), verifyCheckIn);

module.exports = router;
