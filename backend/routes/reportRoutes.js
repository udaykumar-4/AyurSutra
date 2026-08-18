const express = require('express');
const router = express.Router();
const { getPatientReport, getMyReport } = require('../controllers/reportController'); // ⭐️ ADD getMyReport
const { protect, admin } = require('../middleware/authMiddleware');
// Only an admin can generate a full patient report
router.get('/patient/:patientId', protect, admin, getPatientReport);
router.get('/my-report', protect, getMyReport);
module.exports = router;