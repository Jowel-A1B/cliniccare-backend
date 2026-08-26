const express = require('express');
const router = express.Router();
const { scheduleOperation, listOperations, updateOperationStatus } = require('../controllers/otController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.ADMIN));
router.post('/', scheduleOperation);
router.get('/', listOperations);
router.patch('/:id/status', updateOperationStatus);

module.exports = router;
