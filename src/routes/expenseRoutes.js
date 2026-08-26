const express = require('express');
const router = express.Router();
const { addExpense, listExpenses, deleteExpense, getSummary } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.ADMIN));
router.post('/', addExpense);
router.get('/', listExpenses);
router.get('/summary', getSummary);
router.delete('/:id', deleteExpense);

module.exports = router;
