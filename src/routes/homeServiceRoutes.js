const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
} = require('../controllers/homeServiceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.PATIENT), createRequest);
router.get('/mine', protect, allowRoles(ROLES.PATIENT), getMyRequests);
router.get('/all', protect, allowRoles(ROLES.ADMIN), getAllRequests);
router.patch('/:id/status', protect, allowRoles(ROLES.ADMIN), updateRequestStatus);

module.exports = router;
