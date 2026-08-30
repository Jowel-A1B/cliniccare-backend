const express = require('express');
const router = express.Router();
const {
  createClinic,
  getMyClinics,
  getDashboardSummary,
  getPendingDoctors,
  reviewDoctor,
  listPatients,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.ADMIN));
router.post('/clinics', createClinic);
router.get('/clinics', getMyClinics);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/doctors/pending', getPendingDoctors);
router.patch('/doctors/:id/review', reviewDoctor);
router.get('/patients', listPatients);

module.exports = router;
