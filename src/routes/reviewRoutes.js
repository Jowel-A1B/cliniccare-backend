const express = require('express');
const router = express.Router();
const { createReview, getDoctorReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.PATIENT), createReview);
router.get('/doctor/:doctorId', getDoctorReviews); // public

module.exports = router;
