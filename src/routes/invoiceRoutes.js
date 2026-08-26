const express = require('express');
const router = express.Router();
const { createInvoice, getMyInvoicesAsPatient, getInvoiceById } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.ADMIN), createInvoice);
router.get('/mine', protect, allowRoles(ROLES.PATIENT), getMyInvoicesAsPatient);
router.get('/:id', protect, getInvoiceById);

module.exports = router;
