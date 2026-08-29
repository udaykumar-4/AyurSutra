class TreatmentSafetyEngine {
  /**
   * Emergency Symptoms Detection (Priority 1 Check)
   */
  detectEmergency(symptomsText) {
    if (!symptomsText || typeof symptomsText !== 'string') return null;

    const emergencyPatterns = [
      'chest pain', 'chest pressure', 'difficulty breathing', 'shortness of breath',
      'can\'t breathe', 'cannot breathe', 'unconscious', 'loss of consciousness',
      'fainted', 'fainting', 'heavy bleeding', 'severe bleeding', 'seizure', 'convulsions',
      'severe allergic reaction', 'anaphylaxis', 'sudden weakness', 'stroke',
      'face drooping', 'slurred speech', 'suicidal', 'self-harm'
    ];

    const lower = symptomsText.toLowerCase();
    const matched = emergencyPatterns.find(pattern => lower.includes(pattern));

    if (matched) {
      return {
        isEmergency: true,
        matchedPattern: matched,
        emergencyNotice: '🚨 EMERGENCY MEDICAL ALERT: The symptoms entered indicate a potentially acute emergency. Please seek immediate emergency medical care or visit the nearest hospital emergency room. Panchakarma recommendations are suspended for acute emergencies.',
        recommendations: [],
        educationalOnly: true,
        requiresClinicianReview: true
      };
    }

    return null;
  }

  /**
   * Prohibited Request Detection (Priority 2 Check)
   */
  detectProhibitedRequest(symptomsText) {
    if (!symptomsText || typeof symptomsText !== 'string') return null;

    const lower = symptomsText.toLowerCase();

    const isDiagnosisRequest = lower.includes('diagnose me') || lower.includes('what disease do i have') || lower.includes('do i have diabetes') || lower.includes('confirm my diagnosis') || lower.includes('tell me my disease');
    const isMedicationOverride = lower.includes('stop my medicine') || lower.includes('stop my medication') || lower.includes('replace my prescription') || lower.includes('increase my dosage') || lower.includes('change my prescription') || lower.includes('stop taking');
    const isGuaranteedCure = lower.includes('guaranteed cure') || lower.includes('cure my disease') || lower.includes('100% cure');

    if (isDiagnosisRequest) {
      return {
        isProhibited: true,
        type: 'DIAGNOSIS_REQUEST',
        refusalMessage: 'The AyurSutra AI Assistant cannot confirm a diagnosis or state that you have a specific disease. Please consult your qualified clinician for diagnostic evaluation.',
        educationalOnly: true,
        requiresClinicianReview: true
      };
    }

    if (isMedicationOverride) {
      return {
        isProhibited: true,
        type: 'MEDICATION_OVERRIDE',
        refusalMessage: 'Do not stop or modify your prescribed medication based on automated recommendations. Always consult your treating physician before altering any prescription.',
        educationalOnly: true,
        requiresClinicianReview: true
      };
    }

    if (isGuaranteedCure) {
      return {
        isProhibited: true,
        type: 'GUARANTEED_CURE_REQUEST',
        refusalMessage: 'Ayurvedic therapies support holistic balance and body rejuvenation, but outcomes depend on individual constitution and physician evaluation. Guaranteed cures are not claimed.',
        educationalOnly: true,
        requiresClinicianReview: true
      };
    }

    return null;
  }
}

module.exports = new TreatmentSafetyEngine();
