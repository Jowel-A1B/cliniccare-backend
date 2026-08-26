const express = require('express');
const router = express.Router();
const { addBed, listBeds, assignBed, releaseBed, deleteBed } = require('../controllers/bedController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.ADMIN));
router.post('/', addBed);
router.get('/', listBeds);
router.patch('/:id/assign', assignBed);
router.patch('/:id/release', releaseBed);
router.delete('/:id', deleteBed);

module.exports = router;
