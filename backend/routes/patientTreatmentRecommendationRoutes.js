const express = require('express');
const router = express.Router();
const {
  generateRecommendation,
  getPatientRecommendations,
  getPatientRecommendationById
} = require('../controllers/patientTreatmentRecommendationController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/patient-treatment-recommendations
// GET  /api/ai/patient-treatment-recommendations
router.route('/')
  .post(protect, generateRecommendation)
  .get(protect, getPatientRecommendations);

// GET /api/ai/patient-treatment-recommendations/:id
router.route('/:id')
  .get(protect, getPatientRecommendationById);

module.exports = router;
