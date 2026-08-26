const express = require('express');
const router = express.Router();

// All V1 API routes mounted under /api/v1 — a versioned prefix means V2 can
// introduce /api/v2 routes later (e.g. payment-aware booking) without breaking
// existing frontend clients still calling v1 endpoints.
router.use('/auth', require('./authRoutes'));
router.use('/doctors', require('./doctorRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/records', require('./recordRoutes'));
router.use('/prescriptions', require('./prescriptionRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/specializations', require('./specializationRoutes'));
router.use('/clinics', require('./clinicRoutes'));

// --- V2 routes ---
router.use('/family', require('./familyRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/leaves', require('./leaveRoutes'));
router.use('/inventory', require('./inventoryRoutes'));
router.use('/invoices', require('./invoiceRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/checkin', require('./checkinRoutes'));

// --- V3 routes ---
router.use('/ai', require('./aiRoutes'));
router.use('/second-opinions', require('./secondOpinionRoutes'));

// --- V4 routes ---
router.use('/beds', require('./bedRoutes'));
router.use('/ot', require('./otRoutes'));
router.use('/blood-bank', require('./bloodBankRoutes'));
router.use('/ambulance', require('./ambulanceRoutes'));
router.use('/staff', require('./staffRoutes'));
router.use('/expenses', require('./expenseRoutes'));
router.use('/insurance', require('./insuranceRoutes'));
router.use('/audit-logs', require('./auditRoutes'));
router.use('/referrals', require('./referralRoutes'));
router.use('/home-service', require('./homeServiceRoutes'));
router.use('/health-goals', require('./healthGoalRoutes'));
router.use('/community', require('./communityRoutes'));

module.exports = router;
