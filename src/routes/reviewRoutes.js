const express = require('express');
const router = express.Router();
const {
  createReview,
  getDoctorReviews,
  getMyReviewsAsDoctor,
  getReviewByAppointment,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.post('/', protect, allowRoles(ROLES.PATIENT), createReview);
router.get('/mine', protect, allowRoles(ROLES.DOCTOR), getMyReviewsAsDoctor);
router.get('/appointment/:appointmentId', protect, getReviewByAppointment);
router.get('/doctor/:doctorId', getDoctorReviews); // public

module.exports = router;
