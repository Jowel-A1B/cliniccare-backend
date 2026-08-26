const express = require('express');
const router = express.Router();
const { initiatePayment, confirmPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.post('/confirm', protect, confirmPayment);

module.exports = router;
