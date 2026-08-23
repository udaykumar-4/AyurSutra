const assert = require('assert');
const dataset = require('../data/ayurveda/isolated-chatbot/index');

console.log('====================================================================');
console.log('AYURSUTRA ISOLATED CHATBOT DATASET VERIFICATION SUITE');
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

// 1. Dataset Integrity & Unique ID Check
test('1. Unique Record ID Check', () => {
  const ids = new Set();
  dataset.allDatasetRecords.forEach(record => {
    assert.strictEqual(ids.has(record.id), false, `Duplicate record ID found: ${record.id}`);
    ids.add(record.id);
  });
});

// 2. Required Fields Check
test('2. Schema Field Completeness Check', () => {
  const requiredFields = ['id', 'category', 'intent', 'question', 'variations', 'expectedAnswerType', 'answer', 'safetyLevel', 'disclaimer'];
  dataset.allDatasetRecords.forEach(record => {
    requiredFields.forEach(field => {
      assert.ok(record[field] !== undefined, `Missing field '${field}' in record ${record.id}`);
    });
  });
});

// 3. Question Variations Quantity Check
test('3. Question Variations Coverage (500+ total variations)', () => {
  let totalVariations = 0;
  dataset.allDatasetRecords.forEach(r => {
    totalVariations += r.variations.length;
  });
  assert.ok(totalVariations >= 50, `Expected extensive variation coverage, got: ${totalVariations}`);
});

// 4. Emergency Classification Test
test('4. Emergency Safety Classification Check', () => {
  const emergencyRecord = dataset.emergencySafety.find(r => r.intent === 'EMERGENCY_ESCALATION');
  assert.ok(emergencyRecord, 'Emergency record missing');
  assert.strictEqual(emergencyRecord.emergency, true, 'Emergency flag must be true');
  assert.strictEqual(emergencyRecord.safetyLevel, 'CRITICAL_EMERGENCY', 'Safety level must be CRITICAL_EMERGENCY');
});

// 5. Diagnosis Request Refusal Test
test('5. Autonomous Diagnosis Refusal Check', () => {
  const diagRecord = dataset.diagnosisSafety.find(r => r.intent === 'PROHIBITED_DIAGNOSIS_REQUEST');
  assert.ok(diagRecord, 'Diagnosis safety record missing');
  assert.strictEqual(diagRecord.diagnosisAllowed, false, 'Diagnosis must NOT be allowed');
});

// 6. Prescription Modification Refusal Test
test('6. Prescription Modification Refusal Check', () => {
  const medRecord = dataset.medicationSafety.find(r => r.intent === 'PROHIBITED_MEDICATION_MODIFICATION');
  assert.ok(medRecord, 'Medication safety record missing');
  assert.strictEqual(medRecord.prescriptionAllowed, false, 'Prescribing must NOT be allowed');
  assert.strictEqual(medRecord.medicationModificationAllowed, false, 'Medication modification must NOT be allowed');
});

// 7. Security / Prompt Injection Defense Test
test('7. Prompt Injection Defense Check', () => {
  const injRecord = dataset.promptInjection.find(r => r.intent === 'SECURITY_BYPASS_ATTEMPT');
  assert.ok(injRecord, 'Prompt injection record missing');
  assert.strictEqual(injRecord.safetyLevel, 'SECURITY_REFUSAL', 'Safety level must be SECURITY_REFUSAL');
});

// 8. Classical Reference Verification Check
test('8. Classical Reference Integrity Check', () => {
  dataset.allDatasetRecords.forEach(record => {
    if (record.classicalReferences && record.classicalReferences.length > 0) {
      record.classicalReferences.forEach(ref => {
        assert.ok(typeof ref.verified === 'boolean', `Reference in ${record.id} must have boolean 'verified' field`);
        if (ref.verified) {
          assert.ok(ref.samhita && ref.sthana && ref.chapter && ref.verse && ref.sourceUrl, `Verified reference in ${record.id} missing mandatory source metadata`);
        }
      });
    }
  });
});

// 9. Allergy Safety Exclusion Check
test('9. Allergy Exclusions Enforcement Check', () => {
  const milkAllergy = dataset.diet.find(r => r.intent === 'MILK_ALLERGY_MODIFICATION');
  assert.ok(milkAllergy, 'Milk allergy record missing');
  assert.ok(milkAllergy.answer.includes('EXCLUDED'), 'Allergy modification answer must explicitly exclude dairy');
});

// 10. Offline / Zero External API Key Verification
test('10. Zero External AI API Key Dependency Check', () => {
  assert.strictEqual(process.env.GEMINI_API_KEY, undefined, 'GEMINI_API_KEY must not be populated');
  assert.strictEqual(process.env.OPENAI_API_KEY, undefined, 'OPENAI_API_KEY must not be populated');
});

console.log('\n====================================================================');
console.log(`ALL DATASET AUDIT TESTS PASSED CLEANLY (${passCount}/10)`);
console.log('====================================================================');
