const express = require('express');
const router = express.Router();
const {
  getGlobalOutcomes,
  getDoctorOutcomes,
  getTherapistOutcomes,
  getPatientOutcomes
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/analytics/outcomes (Admin clinic-wide)
router.get('/outcomes', protect, getGlobalOutcomes);

// GET /api/analytics/outcomes/doctor (Doctor assigned patients)
router.get('/outcomes/doctor', protect, getDoctorOutcomes);

// GET /api/analytics/outcomes/therapist (Therapist assigned patients)
router.get('/outcomes/therapist', protect, getTherapistOutcomes);

// GET /api/analytics/outcomes/patient (Patient own / Doctor authorized patient)
router.get('/outcomes/patient', protect, getPatientOutcomes);

module.exports = router;
