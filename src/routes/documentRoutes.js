const express = require('express');
const router = express.Router();
const { uploadDocument, getPatientDocuments, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');
const { upload } = require('../services/uploadService');

router.post('/', protect, allowRoles(ROLES.PATIENT), upload.single('file'), uploadDocument);
router.get('/patient/:patientId', protect, allowRoles(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN), getPatientDocuments);
router.delete('/:id', protect, allowRoles(ROLES.PATIENT), deleteDocument);

module.exports = router;
