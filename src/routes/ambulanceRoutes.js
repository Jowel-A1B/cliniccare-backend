const express = require('express');
const router = express.Router();
const { addAmbulance, listFleet, requestAmbulance, completeDispatch } = require('../controllers/ambulanceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.ADMIN), addAmbulance);
router.get('/', protect, allowRoles(ROLES.ADMIN), listFleet);
router.patch('/:id/complete', protect, allowRoles(ROLES.ADMIN), completeDispatch);
router.post('/request', protect, allowRoles(ROLES.PATIENT), requestAmbulance);

module.exports = router;
