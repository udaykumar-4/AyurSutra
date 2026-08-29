const engine = require('./TreatmentRecommendationEngine');
const safety = require('./TreatmentSafetyEngine');

module.exports = {
  processRecommendation: (patientId, symptoms, quickSelections) => engine.processRecommendation(patientId, symptoms, quickSelections),
  detectEmergency: (text) => safety.detectEmergency(text),
  detectProhibitedRequest: (text) => safety.detectProhibitedRequest(text)
};
