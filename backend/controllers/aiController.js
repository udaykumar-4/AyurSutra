const chatbotService = require('../services/ai/chatbotService');
const treatmentRecommendationService = require('../services/ai/treatmentRecommendationService');
const diseasePredictionService = require('../services/ai/diseasePredictionService');

// @desc    Send message to AI Chatbot
// @route   POST /api/ai/chat/message
const postChatMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message string is required' });
    }

    const result = await chatbotService.processChatMessage(req.user, message, conversationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user chatbot history
// @route   GET /api/ai/chat/history
const getChatHistory = async (req, res) => {
  try {
    const history = await chatbotService.getUserHistory(req.user._id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete chatbot conversation
// @route   DELETE /api/ai/chat/history/:id
const deleteChatHistory = async (req, res) => {
  try {
    const result = await chatbotService.deleteConversation(req.user._id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate AI Treatment Recommendation Options (Doctor Only)
// @route   POST /api/ai/treatment-recommendations/generate
const generateTreatmentRecommendation = async (req, res) => {
  try {
    const { patientId, presentingSymptoms } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required' });
    }

    const result = await treatmentRecommendationService.generateRecommendation(
      req.user,
      patientId,
      presentingSymptoms
    );

    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// @desc    Get Saved AI Treatment Recommendations for a Patient (Doctor Only)
// @route   GET /api/ai/treatment-recommendations/:patientId
const getPatientRecommendations = async (req, res) => {
  try {
    const result = await treatmentRecommendationService.getPatientRecommendations(
      req.user,
      req.params.patientId
    );

    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// @desc    Generate AI Disease Prediction Support (Doctor Only)
// @route   POST /api/ai/predictions/generate
const generateDiseasePrediction = async (req, res) => {
  try {
    const { patientId, presentingSymptoms } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required' });
    }

    const result = await diseasePredictionService.generatePrediction(
      req.user,
      patientId,
      presentingSymptoms
    );

    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// @desc    Get Saved AI Disease Predictions for a Patient (Doctor Only)
// @route   GET /api/ai/predictions/patient/:patientId
const getPatientPredictions = async (req, res) => {
  try {
    const result = await diseasePredictionService.getPatientPredictions(
      req.user,
      req.params.patientId
    );

    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
};

module.exports = {
  postChatMessage,
  getChatHistory,
  deleteChatHistory,
  generateTreatmentRecommendation,
  getPatientRecommendations,
  generateDiseasePrediction,
  getPatientPredictions
};
