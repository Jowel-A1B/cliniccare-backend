const express = require('express');
const router = express.Router();
const { createGoal, getMyGoals, logProgress, deleteGoal } = require('../controllers/healthGoalController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.PATIENT));
router.post('/', createGoal);
router.get('/', getMyGoals);
router.post('/:id/log', logProgress);
router.delete('/:id', deleteGoal);

module.exports = router;
