const express = require('express');
const router = express.Router();
const { registerDonor, searchDonors } = require('../controllers/bloodBankController');

router.post('/donors', registerDonor); // open to anyone — donors need not be patients
router.get('/donors', searchDonors); // public search, no login required in an emergency

module.exports = router;
