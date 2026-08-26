const express = require('express');
const router = express.Router();
const {
  createReferral,
  getSentReferrals,
  getIncomingReferrals,
  acknowledgeReferral,
} = require('../controllers/referralController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.DOCTOR));
router.post('/', createReferral);
router.get('/sent', getSentReferrals);
router.get('/incoming', getIncomingReferrals);
router.patch('/:id/acknowledge', acknowledgeReferral);

module.exports = router;
