const express = require('express');
const router = express.Router();
const {
  requestSecondOpinion,
  getMyRequestsAsPatient,
  getIncomingRequestsAsDoctor,
  respondToRequest,
} = require('../controllers/secondOpinionController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.PATIENT), requestSecondOpinion);
router.get('/mine', protect, allowRoles(ROLES.PATIENT), getMyRequestsAsPatient);
router.get('/incoming', protect, allowRoles(ROLES.DOCTOR), getIncomingRequestsAsDoctor);
router.patch('/:id/respond', protect, allowRoles(ROLES.DOCTOR), respondToRequest);

module.exports = router;
