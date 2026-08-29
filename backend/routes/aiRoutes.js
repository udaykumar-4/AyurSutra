const express = require('express');
const router = express.Router();
const {
  postChatMessage,
  getChatHistory,
  deleteChatHistory,
  generateTreatmentRecommendation,
  getPatientRecommendations,
  generateDiseasePrediction,
  getPatientPredictions
} = require('../controllers/aiController');
const patientTreatmentRecommendationController = require('../controllers/patientTreatmentRecommendationController');
const { protect } = require('../middleware/authMiddleware');

// Chatbot routes
router.post('/chat/message', protect, postChatMessage);
router.get('/chat/history', protect, getChatHistory);
router.delete('/chat/history/:id', protect, deleteChatHistory);

// Patient Isolated Treatment Recommendations (Direct routes under /api/ai)
router.post('/patient-treatment-recommendations', protect, patientTreatmentRecommendationController.generateRecommendation);
router.get('/patient-treatment-recommendations', protect, patientTreatmentRecommendationController.getPatientRecommendations);
router.get('/patient-treatment-recommendations/:id', protect, patientTreatmentRecommendationController.getPatientRecommendationById);

// Clinical Decision Support: Treatment Recommendations
router.post('/treatment-recommendations/generate', protect, generateTreatmentRecommendation);
router.get('/treatment-recommendations/:patientId', protect, getPatientRecommendations);

// Clinical Decision Support: Disease Prediction
router.post('/predictions/generate', protect, generateDiseasePrediction);
router.get('/predictions/patient/:patientId', protect, getPatientPredictions);

module.exports = router;
