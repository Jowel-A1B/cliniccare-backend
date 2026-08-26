const express = require('express');
const router = express.Router();
const { addStaff, listStaff, deleteStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.ADMIN));
router.post('/', addStaff);
router.get('/', listStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
