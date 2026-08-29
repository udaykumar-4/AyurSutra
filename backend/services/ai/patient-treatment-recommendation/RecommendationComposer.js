class RecommendationComposer {
  /**
   * Compose final structured output JSON
   */
  composeSuccessResponse(symptoms, quickSelections, matchedTherapies, patientContext) {
    const safetyWarnings = [];

    if (!patientContext.hasRecordedAllergies) {
      safetyWarnings.push('Allergy history is unconfirmed in database; clinician verification required before beginning therapy.');
    }

    return {
      success: true,
      symptoms: symptoms || 'General Wellness Query',
      quickSelections: quickSelections || [],
      educationalWording: 'Based on the symptoms you entered, the following Ayurvedic therapies may be relevant for educational consideration.',
      recommendations: matchedTherapies,
      safetyWarnings: safetyWarnings,
      confidence: 'high',
      educationalOnly: true,
      requiresClinicianReview: true,
      disclaimer: '⚠️ AI-generated educational treatment recommendations. Final prescribing authority rests 100% with your qualified Ayurvedic physician.'
    };
  }
}

module.exports = new RecommendationComposer();
