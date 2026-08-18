const GeminiAIProvider = require('./providers/GeminiAIProvider');
const ChatConversation = require('../../models/chatConversation');
const AIAuditLog = require('../../models/aiAuditLog');
const User = require('../../models/user');
const Prescription = require('../../models/prescription');
const Appointment = require('../../models/appointment');

const aiProvider = new GeminiAIProvider();

// In-Memory Rate Limiting Tracker (userId -> array of timestamps)
const userRateLimits = new Map();

class ChatbotService {
  /**
   * Check rate limiting (Max 20 requests per 15 minutes per user)
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 20;

    let timestamps = userRateLimits.get(userId.toString()) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return false;
    }

    timestamps.push(now);
    userRateLimits.set(userId.toString(), timestamps);
    return true;
  }

  /**
   * Detect Emergency Symptoms
   */
  detectEmergencyKeywords(text) {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'cannot breathe', 'severe breathing',
      'unconscious', 'fainted', 'heavy bleeding', 'severe allergic reaction', 'anaphylaxis'
    ];

    const lower = text.toLowerCase();
    return emergencyKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Main Chat Processor
   */
  async processChatMessage(user, messageText, conversationId = null) {
    // 1. Rate Limiting Check
    if (!this.checkRateLimit(user._id)) {
      return {
        success: false,
        status: 'rate_limited',
        response: 'You have reached the maximum rate limit (20 messages per 15 minutes). Please wait a few minutes before asking another question.',
        isPersonalized: false
      };
    }

    // 2. Message Length Check
    if (!messageText || messageText.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }

    if (messageText.length > 1000) {
      return {
        success: false,
        status: 'validation_error',
        response: 'Message length exceeds the maximum limit of 1000 characters. Please shorten your question.',
        isPersonalized: false
      };
    }

    // 3. Emergency Symptom Guard
    if (this.detectEmergencyKeywords(messageText)) {
      return {
        success: true,
        response: '⚠️ EMERGENCY NOTICE: Your question references potentially urgent medical symptoms (e.g. chest pain, severe breathing difficulty, or severe bleeding). Please seek immediate emergency medical evaluation at a hospital or contact local emergency medical services. Do not rely on an AI assistant for urgent or acute conditions.',
        isPersonalized: false,
        isEmergency: true
      };
    }

    // 4. Construct Minimal Context Object based on User Role
    let contextData = {};
    let systemPrompt = '';

    if (user.role === 'patient') {
      systemPrompt = `You are AyurSutra AI Wellness Assistant. You provide personalized Ayurvedic wellness education, diet advice, and Panchakarma therapy guidance. You are NOT a doctor. You must NOT diagnose, prescribe, or alter treatments. Direct users to consult their doctor for medical decisions.`;

      // Fetch minimum necessary patient context
      const patientUser = await User.findById(user._id).select('age gender condition allergies');
      const activeRx = await Prescription.findOne({ patientId: user._id, status: 'in-progress' });
      const nextAppt = await Appointment.findOne({ patientId: user._id, status: 'scheduled' }).sort({ appointment_date: 1 });

      if (patientUser) {
        contextData.age = patientUser.age || 'N/A';
        contextData.gender = patientUser.gender || 'N/A';
        contextData.recordedCondition = patientUser.condition || 'N/A';
        contextData.knownAllergies = patientUser.allergies || 'None recorded';
      }

      if (activeRx) {
        contextData.activeTherapyPlan = activeRx.treatment;
        contextData.sessionProgress = `${activeRx.progressCompleted} of ${activeRx.duration} sessions completed`;
      }

      if (nextAppt) {
        contextData.nextUpcomingAppointment = `${nextAppt.treatment} on ${new Date(nextAppt.appointment_date).toLocaleDateString()} at ${nextAppt.appointment_time}`;
      }
    } else if (user.role === 'doctor') {
      systemPrompt = `You are AyurSutra AI Clinical Assistant for Doctors. You assist licensed Ayurvedic physicians with medical literature references, Panchakarma protocol summaries, and clinical concepts.`;
    } else if (user.role === 'therapist') {
      systemPrompt = `You are AyurSutra AI Therapy Assistant for Therapists. You provide Panchakarma session care steps, post-therapy guidance, and wellness education.`;
    } else {
      systemPrompt = `You are AyurSutra Clinic Assistant. You assist clinic staff with general operational workflows and platform guidance.`;
    }

    // 5. Query AI Provider
    const aiResult = await aiProvider.generateChatResponse(systemPrompt, messageText, contextData);

    // 6. Save or Update Conversation in Database
    let conversation;
    if (conversationId) {
      conversation = await ChatConversation.findOne({ _id: conversationId, userId: user._id });
    }

    if (!conversation) {
      conversation = new ChatConversation({
        userId: user._id,
        role: user.role,
        title: messageText.slice(0, 30) + '...',
        messages: []
      });
    }

    // Push user message and assistant reply
    conversation.messages.push({
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    });

    conversation.messages.push({
      sender: 'assistant',
      text: aiResult.response,
      timestamp: new Date(),
      isPersonalized: aiResult.isPersonalized
    });

    await conversation.save();

    // 7. Audit Log
    await AIAuditLog.create({
      userId: user._id,
      role: user.role,
      action: 'AI_CHATBOT_MESSAGE',
      metadata: { conversationId: conversation._id, isPersonalized: aiResult.isPersonalized }
    });

    return {
      success: true,
      conversationId: conversation._id,
      response: aiResult.response,
      isPersonalized: aiResult.isPersonalized,
      disclaimer: '⚠️ AI Assistant guidance is for educational purposes only. Final clinical decisions must be made by a licensed clinician.'
    };
  }

  /**
   * Get User Chat Conversation History
   */
  async getUserHistory(userId) {
    return await ChatConversation.find({ userId }).sort({ updatedAt: -1 });
  }

  /**
   * Delete Specific Chat Conversation
   */
  async deleteConversation(userId, conversationId) {
    const conv = await ChatConversation.findOne({ _id: conversationId, userId });
    if (!conv) {
      throw new Error('Conversation not found or unauthorized');
    }
    await conv.deleteOne();
    return { message: 'Conversation deleted successfully' };
  }
}

module.exports = new ChatbotService();
