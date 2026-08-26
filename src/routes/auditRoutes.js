const express = require('express');
const router = express.Router();
const { listAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.get('/', protect, allowRoles(ROLES.ADMIN), listAuditLogs);

module.exports = router;
