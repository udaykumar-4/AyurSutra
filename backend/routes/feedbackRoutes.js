const express = require('express');
const router = express.Router();
const { 
  createFeedback, 
  getFeedbackForDoctor, 
  getFeedbackForTherapist 
} = require('../controllers/feedbackController');

// This line IMPORTS the functions
const { protect, doctor, therapist } = require('../middleware/authMiddleware');

// Patient submits feedback
router.post('/', protect, createFeedback);

// Doctor views their feedback
router.get('/doctor', protect, doctor, getFeedbackForDoctor); 

// Therapist views their feedback
router.get('/therapist', protect, therapist, getFeedbackForTherapist);

module.exports = router;