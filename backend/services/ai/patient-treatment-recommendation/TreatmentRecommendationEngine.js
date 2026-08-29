const safetyEngine = require('./TreatmentSafetyEngine');
const symptomClassifier = require('./SymptomClassifier');
const therapyMatcher = require('./AyurvedaTherapyMatcher');
const composer = require('./RecommendationComposer');
const contextReader = require('./PatientContextReader');

class TreatmentRecommendationEngine {
  /**
   * Main Pipeline Execution
   */
  async processRecommendation(patientId, symptomsText = '', quickSelections = []) {
    const combinedText = (symptomsText + ' ' + (quickSelections || []).join(' ')).trim();

    // 1. Safety Check: Emergency Symptoms Detection (Priority 1)
    const emergencyResult = safetyEngine.detectEmergency(combinedText);
    if (emergencyResult) {
      return {
        success: false,
        isEmergency: true,
        emergencyNotice: emergencyResult.emergencyNotice,
        educationalWording: 'Emergency detected. Panchakarma recommendations are suspended.',
        recommendations: [],
        educationalOnly: true,
        requiresClinicianReview: true
      };
    }

    // 2. Safety Check: Prohibited Request Detection (Priority 2)
    const prohibitedResult = safetyEngine.detectProhibitedRequest(combinedText);
    if (prohibitedResult) {
      return {
        success: false,
        isProhibited: true,
        refusalMessage: prohibitedResult.refusalMessage,
        educationalWording: 'Autonomous diagnosis or prescription override request refused.',
        recommendations: [],
        educationalOnly: true,
        requiresClinicianReview: true
      };
    }

    // 3. Read Patient Context
    const patientContext = await contextReader.readContext(patientId);
    if (!patientContext) {
      throw new Error('Patient record not found');
    }

    // 4. Classify Symptoms
    const categoryTags = symptomClassifier.classify(symptomsText, quickSelections);

    // 5. Match Ayurveda Therapies against Knowledge Base & Clinical Dataset
    const matchedTherapies = therapyMatcher.match(categoryTags, patientContext, symptomsText, quickSelections);

    // 6. Compose Final Standardized Response
    return composer.composeSuccessResponse(symptomsText, quickSelections, matchedTherapies, patientContext);
  }
}

module.exports = new TreatmentRecommendationEngine();
