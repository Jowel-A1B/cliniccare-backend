const express = require('express');
const router = express.Router();
const { addItem, listItems, updateItem, deleteItem } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.ADMIN));
router.post('/', addItem);
router.get('/', listItems);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
