const express = require('express');
const router = express.Router();
const { addFamilyMember, getMyFamilyMembers, deleteFamilyMember } = require('../controllers/familyController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.PATIENT));
router.post('/', addFamilyMember);
router.get('/', getMyFamilyMembers);
router.delete('/:id', deleteFamilyMember);

module.exports = router;
