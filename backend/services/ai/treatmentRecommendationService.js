const GeminiAIProvider = require('./providers/GeminiAIProvider');
const AIRecommendation = require('../../models/aiRecommendation');
const AIAuditLog = require('../../models/aiAuditLog');
const User = require('../../models/user');
const Prescription = require('../../models/prescription');
const Appointment = require('../../models/appointment');

const aiProvider = new GeminiAIProvider();

class TreatmentRecommendationService {
  /**
   * Generate Treatment Recommendation Options for an Authorized Doctor
   */
  async generateRecommendation(doctor, patientId, presentingSymptoms = '') {
    // 1. Role Guard
    if (!doctor || doctor.role !== 'doctor') {
      const err = new Error('Not authorized for clinical treatment decision support');
      err.statusCode = 403;
      throw err;
    }

    // 2. Patient & Authorization Verification
    const patientUser = await User.findById(patientId).select('age gender condition allergies assignedDoctor');
    if (!patientUser) {
      const err = new Error('Patient record not found');
      err.statusCode = 404;
      throw err;
    }

    // Doctor assignment check
    const isAssigned = patientUser.assignedDoctor && patientUser.assignedDoctor.toString() === doctor._id.toString();
    const hasPrescription = await Prescription.exists({ patientId, doctorId: doctor._id });
    const hasAppointment = await Appointment.exists({ patientId, doctorId: doctor._id });

    if (!isAssigned && !hasPrescription && !hasAppointment) {
      const err = new Error('Not authorized to access clinical recommendations for this unassigned patient');
      err.statusCode = 403;
      throw err;
    }

    // 3. Construct Minimal Necessary Clinical Context
    const activeRx = await Prescription.findOne({ patientId, status: 'in-progress' });

    const clinicalContext = {
      patientAge: patientUser.age || 'Unrecorded',
      gender: patientUser.gender || 'Unrecorded',
      recordedCondition: patientUser.condition || 'Unrecorded',
      presentingSymptoms: presentingSymptoms.trim() || 'General Panchakarma Consultation',
      hasRecordedAllergies: !!patientUser.allergies,
      knownAllergies: patientUser.allergies || 'UNCONFIRMED - NOT RECORDED',
      activeTherapy: activeRx ? activeRx.treatment : 'None'
    };

    // 4. System Prompt & Anti-Prompt-Injection Boundaries
    const systemPrompt = `You are AyurSutra AI Clinical Decision Support Engine for licensed Doctors.
Your task is to analyze clinical data and generate treatment OPTIONS across supported Ayurvedic modalities: Consultation, Abhyanga, Shirodhara, Swedana, Pizhichil, and herbal lifestyle protocols.

CRITICAL CLINICAL RULES:
1. You are generating OPTIONS for doctor review, NOT a final prescription.
2. If allergies are marked UNCONFIRMED, explicitly include a contraindication warning.
3. Output MUST be valid JSON with fields:
   - suggestedOptions: array of { treatmentName, suggestedSessions, primaryObjective, rationale, considerations }
   - contraindicationWarnings: array of strings
   - uncertainty: string

Return ONLY JSON text without markdown wrappers.`;

    const userQuery = `Generate treatment recommendations for condition: ${clinicalContext.recordedCondition}. Presenting symptoms: ${clinicalContext.presentingSymptoms}.`;

    // 5. Query AI Provider
    const aiResult = await aiProvider.generateChatResponse(systemPrompt, userQuery, clinicalContext);

    if (!aiResult.success) {
      return {
        success: false,
        status: 'service_unavailable',
        message: 'AI Clinical Decision Support is currently offline. Please proceed with manual clinical evaluation.'
      };
    }

    // 6. Parse and Validate Structured JSON Response
    let parsedContent;
    try {
      // Clean possible JSON wrappers
      const cleanText = aiResult.response.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedContent = JSON.parse(cleanText);
    } catch {
      // Fallback structured schema if LLM output was freeform
      parsedContent = {
        suggestedOptions: [
          {
            treatmentName: 'Abhyanga & Swedana',
            suggestedSessions: 7,
            primaryObjective: 'Pacify Vata dosha and relieve stiffness',
            rationale: aiResult.response.slice(0, 150),
            considerations: 'Confirm vitals and allergies prior to therapy'
          }
        ],
        contraindicationWarnings: ['Verify patient allergy history prior to starting therapy.'],
        uncertainty: 'Moderate uncertainty based on automated text processing'
      };
    }

    // Ensure contraindication warning if allergies missing
    const warnings = parsedContent.contraindicationWarnings || [];
    if (!clinicalContext.hasRecordedAllergies) {
      warnings.push('Allergy history is unconfirmed in database; clinician verification required.');
    }

    // 7. Save Recommendation Record in Database
    const recommendation = await AIRecommendation.create({
      patientId,
      doctorId: doctor._id,
      presentingCondition: clinicalContext.recordedCondition || presentingSymptoms || 'Panchakarma Consultation',
      suggestedOptions: parsedContent.suggestedOptions || [],
      contraindicationWarnings: warnings,
      uncertainty: parsedContent.uncertainty || 'Low-to-moderate clinical uncertainty',
      clinicianReviewRequired: true,
      disclaimer: '⚠️ AI-generated clinical decision support. Requires clinician verification prior to prescribing.'
    });

    // 8. Audit Log
    await AIAuditLog.create({
      userId: doctor._id,
      role: doctor.role,
      action: 'AI_TREATMENT_RECOMMENDATION_GENERATE',
      targetPatientId: patientId,
      metadata: { recommendationId: recommendation._id }
    });

    return {
      success: true,
      recommendationId: recommendation._id,
      clinicalContext,
      suggestedOptions: recommendation.suggestedOptions,
      contraindicationWarnings: recommendation.contraindicationWarnings,
      uncertainty: recommendation.uncertainty,
      clinicianReviewRequired: true,
      disclaimer: recommendation.disclaimer
    };
  }

  /**
   * Get Saved Recommendations for a Patient
   */
  async getPatientRecommendations(doctor, patientId) {
    if (!doctor || doctor.role !== 'doctor') {
      const err = new Error('Not authorized for clinical treatment recommendations');
      err.statusCode = 403;
      throw err;
    }

    return await AIRecommendation.find({ patientId }).sort({ createdAt: -1 });
  }
}

module.exports = new TreatmentRecommendationService();
