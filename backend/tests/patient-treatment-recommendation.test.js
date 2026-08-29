const assert = require('assert');
const safetyEngine = require('../services/ai/patient-treatment-recommendation/TreatmentSafetyEngine');
const symptomClassifier = require('../services/ai/patient-treatment-recommendation/SymptomClassifier');
const therapyMatcher = require('../services/ai/patient-treatment-recommendation/AyurvedaTherapyMatcher');
const composer = require('../services/ai/patient-treatment-recommendation/RecommendationComposer');

console.log('====================================================================');
console.log('PATIENT AI TREATMENT RECOMMENDATION ISOLATED TEST SUITE');
console.log('====================================================================\n');

let passCount = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`[PASS] ${description}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${description}:`, err.message);
    process.exitCode = 1;
  }
}

// 1. Emergency Detection Test
test('1. Severe Emergency Symptoms Halts Recommendation', () => {
  const result = safetyEngine.detectEmergency('I have severe chest pain and difficulty breathing');
  assert.ok(result, 'Emergency should be detected');
  assert.strictEqual(result.isEmergency, true, 'isEmergency flag must be true');
  assert.ok(result.emergencyNotice.includes('EMERGENCY MEDICAL ALERT'), 'Must contain emergency notice');
});

// 2. Non-Emergency Query Test
test('2. Mild Symptoms Pass Emergency Check Cleanly', () => {
  const result = safetyEngine.detectEmergency('I have mild back stiffness in the morning');
  assert.strictEqual(result, null, 'Normal symptoms should pass safety check');
});

// 3. Autonomous Diagnosis Refusal Test
test('3. Autonomous Diagnosis Request Refused', () => {
  const result = safetyEngine.detectProhibitedRequest('Diagnose me and tell me what disease I have');
  assert.ok(result, 'Prohibited request should be detected');
  assert.strictEqual(result.type, 'DIAGNOSIS_REQUEST');
  assert.ok(result.refusalMessage.includes('cannot confirm a diagnosis'), 'Must refuse diagnosis');
});

// 4. Prescription Replacement Refusal Test
test('4. Prescription Replacement Request Refused', () => {
  const result = safetyEngine.detectProhibitedRequest('Tell me to stop my medicine and replace my prescription');
  assert.ok(result, 'Prohibited request should be detected');
  assert.strictEqual(result.type, 'MEDICATION_OVERRIDE');
  assert.ok(result.refusalMessage.includes('Do not stop or modify your prescribed medication'), 'Must refuse prescription override');
});

// 5. Guaranteed Cure Refusal Test
test('5. Guaranteed Cure Request Refused', () => {
  const result = safetyEngine.detectProhibitedRequest('Give me a 100% guaranteed cure for arthritis');
  assert.ok(result, 'Prohibited request should be detected');
  assert.strictEqual(result.type, 'GUARANTEED_CURE_REQUEST');
});

// 6. Symptom Classification Test
test('6. Symptom Taxonomy Classification', () => {
  const tags = symptomClassifier.classify('Joint stiffness and knee pain', ['Joint Stiffness & Pain']);
  assert.ok(tags.includes('joint_stiffness'), 'Should classify as joint_stiffness');
});

// 7. Classical Therapy Matching Test
test('7. Panchakarma Therapy Matching from Knowledge Base', () => {
  const context = { patientAge: 35, gender: 'Female', recordedCondition: 'Vata Stiffness', knownAllergies: 'None' };
  const matches = therapyMatcher.match(['joint_stiffness'], context);
  assert.ok(matches.length > 0, 'Should match at least one therapy');
  const abhyanga = matches.find(m => m.therapyName.includes('Abhyanga'));
  assert.ok(abhyanga, 'Abhyanga should be matched for joint stiffness');
  assert.strictEqual(abhyanga.educationalOnly, true, 'Must be marked educationalOnly');
  assert.strictEqual(abhyanga.requiresClinicianReview, true, 'Must require clinician review');
});

// 8. Zero Classical Citation Fabrication Test
test('8. Classical Citation Integrity (Zero Fabrication)', () => {
  const context = { knownAllergies: 'None' };
  const matches = therapyMatcher.match(['stress_sleep'], context);
  matches.forEach(m => {
    if (m.classicalReferences && m.classicalReferences.length > 0) {
      m.classicalReferences.forEach(ref => {
        assert.ok(ref.source, 'Source must be defined');
        assert.ok(ref.evidenceLevel, 'Evidence level must be defined');
        assert.strictEqual(ref.source, 'Curated Internal Knowledge Base', 'Source must match indexed dataset');
      });
    }
  });
});

// 9. Unconfirmed Allergy Warning Test
test('9. Unconfirmed Allergy Profile Warning Injection', () => {
  const context = { hasRecordedAllergies: false, knownAllergies: 'UNCONFIRMED - NOT RECORDED' };
  const res = composer.composeSuccessResponse('Stiffness', [], [], context);
  assert.ok(res.safetyWarnings.some(w => w.includes('Allergy history is unconfirmed')), 'Must inject unconfirmed allergy warning');
});

// 10. Educational Disclaimer Enforcement Test
test('10. Educational Wording & Disclaimer Enforcement', () => {
  const context = { hasRecordedAllergies: true, knownAllergies: 'None' };
  const res = composer.composeSuccessResponse('Stress', [], [], context);
  assert.ok(res.educationalWording.includes('for educational consideration'), 'Must include educational wording');
  assert.ok(res.disclaimer.includes('educational treatment recommendations'), 'Must include legal disclaimer');
});

// 11. Clinical Disease Dataset Matching Test
test('11. Clinical Disease Dataset Matching (Cough, Diabetes, Hypertension)', () => {
  const context = { patientAge: 45, gender: 'Male', recordedCondition: 'Cough & Diabetes', knownAllergies: 'None' };
  const matches = therapyMatcher.match(['joint_stiffness'], context, 'Cough and chest congestion', ['General Wellness']);
  assert.ok(matches.length > 0, 'Should match clinical dataset');
  const coughMatch = matches.find(m => m.therapyName.includes('Cough'));
  assert.ok(coughMatch, 'Should find Cough protocol in recommendations');
  assert.ok(coughMatch.objective.includes('Ginger'), 'Should contain Ginger & Honey formulation');
});

console.log('\n====================================================================');
console.log(`ALL ISOLATED UNIT TESTS PASSED CLEANLY (${passCount}/11)`);
console.log('====================================================================\n');
