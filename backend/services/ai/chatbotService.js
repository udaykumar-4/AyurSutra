const AyurSutraKnowledgeProvider = require('./providers/AyurSutraKnowledgeProvider');
const ChatConversation = require('../../models/chatConversation');
const AIAuditLog = require('../../models/aiAuditLog');
const User = require('../../models/user');
const Prescription = require('../../models/prescription');
const Appointment = require('../../models/appointment');

const aiProvider = new AyurSutraKnowledgeProvider();
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
   * Main Chat Processor (Self-contained, 100% Offline AyurSutra Intelligent Guidance Engine)
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

    // 3. Construct Authorized Minimal Context Object
    let contextData = {};

    if (user.role === 'patient') {
      const patientUser = await User.findById(user._id).select('age gender condition allergies');
      const activeRx = await Prescription.findOne({ patientId: user._id, status: 'in-progress' });
      const nextAppt = await Appointment.findOne({ patientId: user._id, status: 'scheduled' }).sort({ appointment_date: 1 });

      if (patientUser) {
        contextData.age = patientUser.age || 'N/A';
        contextData.gender = patientUser.gender || 'N/A';
        contextData.recordedCondition = patientUser.condition || 'N/A';
        contextData.knownAllergies = patientUser.allergies || 'UNCONFIRMED - NOT RECORDED';
      }

      if (activeRx) {
        contextData.activeTherapyPlan = activeRx.treatment;
        contextData.sessionProgress = `${activeRx.progressCompleted} of ${activeRx.duration} sessions completed`;
      }

      if (nextAppt) {
        contextData.nextUpcomingAppointment = `${nextAppt.treatment} on ${new Date(nextAppt.appointment_date).toLocaleDateString()} at ${nextAppt.appointment_time}`;
      }
    }

    // 4. Query Self-Contained Knowledge Provider (0 External HTTP calls)
    const aiResult = await aiProvider.generateChatResponse('', messageText, contextData);

    // 5. Save or Update Conversation in Database
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

    conversation.messages.push({
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    });

    conversation.messages.push({
      sender: 'assistant',
      text: aiResult.answer,
      timestamp: new Date(),
      isPersonalized: aiResult.personalizationApplied
    });

    await conversation.save();

    // 6. Audit Log (No PII logged!)
    await AIAuditLog.create({
      userId: user._id,
      role: user.role,
      action: 'AI_CHATBOT_MESSAGE',
      metadata: {
        conversationId: conversation._id,
        intent: aiResult.intent,
        personalizationApplied: aiResult.personalizationApplied,
        emergency: aiResult.emergency
      }
    });

    return {
      success: true,
      conversationId: conversation._id,
      response: aiResult.answer,
      structured: aiResult,
      isPersonalized: aiResult.personalizationApplied,
      disclaimer: aiResult.disclaimer
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
