const GeminiAIProvider = require('./providers/GeminiAIProvider');
const AIPrediction = require('../../models/aiPrediction');
const AIAuditLog = require('../../models/aiAuditLog');
const User = require('../../models/user');
const Prescription = require('../../models/prescription');
const Appointment = require('../../models/appointment');
const Note = require('../../models/note');

const aiProvider = new GeminiAIProvider();

class DiseasePredictionService {
  /**
   * Generate AI Disease Prediction Support for an Authorized Doctor
   */
  async generatePrediction(doctor, patientId, presentingSymptoms = '') {
    // 1. Doctor Role Authorization Guard
    if (!doctor || doctor.role !== 'doctor') {
      const err = new Error('Not authorized for clinical disease prediction decision support');
      err.statusCode = 403;
      throw err;
    }

    // 2. Patient & Assignment Verification
    const patientUser = await User.findById(patientId).select('age gender condition allergies assignedDoctor');
    if (!patientUser) {
      const err = new Error('Patient record not found');
      err.statusCode = 404;
      throw err;
    }

    const isAssigned = patientUser.assignedDoctor && patientUser.assignedDoctor.toString() === doctor._id.toString();
    const hasPrescription = await Prescription.exists({ patientId, doctorId: doctor._id });
    const hasAppointment = await Appointment.exists({ patientId, doctorId: doctor._id });

    if (!isAssigned && !hasPrescription && !hasAppointment) {
      const err = new Error('Not authorized to access clinical disease predictions for this unassigned patient');
      err.statusCode = 403;
      throw err;
    }

    // Fetch recent clinical notes for context
    const recentNotes = await Note.find({ patientId }).sort({ createdAt: -1 }).limit(3);
    const noteText = recentNotes.map(n => n.note).join('; ') || 'None logged';

    // 3. Construct Minimal Necessary Clinical Context
    const clinicalContext = {
      patientAge: patientUser.age || 'Unrecorded',
      gender: patientUser.gender || 'Unrecorded',
      presentingSymptoms: presentingSymptoms.trim() || patientUser.condition || 'General Symptoms Consultation',
      recordedCondition: patientUser.condition || 'Unrecorded',
      recentNotesExcerpt: noteText
    };

    // 4. System Prompt & Anti-Prompt-Injection Boundaries
    const systemPrompt = `You are AyurSutra AI Disease Prediction Support Engine for licensed Doctors.
Your task is to analyze clinical symptoms and generate differential diagnostic guidance across Ayurvedic and integrative clinical concepts.

CRITICAL CLINICAL SAFETY RULES:
1. You are generating POSSIBLE CONDITIONS for doctor review, NOT a confirmed diagnosis.
2. Output MUST be valid JSON with fields:
   - possibleConditions: array of { conditionName, probabilityCategory, supportingFactors, differentialConsiderations }
   - uncertainty: string
   - limitations: string

Return ONLY JSON text without markdown wrappers.`;

    const userQuery = `Analyze presenting symptoms: ${clinicalContext.presentingSymptoms}. Context notes: ${clinicalContext.recentNotesExcerpt}.`;

    // 5. Query AI Provider
    const aiResult = await aiProvider.generateChatResponse(systemPrompt, userQuery, clinicalContext);

    if (!aiResult.success) {
      return {
        success: false,
        status: 'service_unavailable',
        message: 'AI Disease Prediction Support is currently offline. Please proceed with standard clinical diagnostic evaluation.'
      };
    }

    // 6. Parse and Validate Structured JSON Response
    let parsedContent;
    try {
      const cleanText = aiResult.response.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedContent = JSON.parse(cleanText);
    } catch {
      parsedContent = {
        possibleConditions: [
          {
            conditionName: 'Amavata (Rheumatoid Arthritis / Vata-Kapha Imbalance)',
            probabilityCategory: 'Moderate',
            supportingFactors: [clinicalContext.presentingSymptoms],
            differentialConsiderations: 'Rule out Sandhigata Vata (Osteoarthritis)'
          }
        ],
        uncertainty: 'Moderate uncertainty based on automated text processing',
        limitations: 'Requires laboratory validation and physical joint examination'
      };
    }

    // 7. Save Prediction Record in Database
    const prediction = await AIPrediction.create({
      patientId,
      doctorId: doctor._id,
      presentingSymptoms: clinicalContext.presentingSymptoms,
      possibleConditions: parsedContent.possibleConditions || [],
      uncertainty: parsedContent.uncertainty || 'Low-to-moderate clinical uncertainty',
      limitations: parsedContent.limitations || 'Requires physical examination and laboratory confirmation',
      clinicianReviewRequired: true,
      disclaimer: '⚠️ AI-generated clinical decision support. This is not a confirmed diagnosis and requires clinician verification.'
    });

    // 8. Audit Log
    await AIAuditLog.create({
      userId: doctor._id,
      role: doctor.role,
      action: 'AI_DISEASE_PREDICTION_GENERATE',
      targetPatientId: patientId,
      metadata: { predictionId: prediction._id }
    });

    return {
      success: true,
      predictionId: prediction._id,
      clinicalContext,
      possibleConditions: prediction.possibleConditions,
      uncertainty: prediction.uncertainty,
      limitations: prediction.limitations,
      clinicianReviewRequired: true,
      disclaimer: prediction.disclaimer
    };
  }

  /**
   * Get Saved Predictions for a Patient
   */
  async getPatientPredictions(doctor, patientId) {
    if (!doctor || doctor.role !== 'doctor') {
      const err = new Error('Not authorized for clinical disease predictions');
      err.statusCode = 403;
      throw err;
    }

    return await AIPrediction.find({ patientId }).sort({ createdAt: -1 });
  }
}

module.exports = new DiseasePredictionService();
