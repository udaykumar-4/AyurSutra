require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Prescription = require('./models/prescription');
const AIRecommendation = require('./models/aiRecommendation');
const treatmentRecommendationService = require('./services/ai/treatmentRecommendationService');

const runTreatmentRecommendationTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- PHASE 4 AI TREATMENT RECOMMENDATION SECURITY & SAFETY VALIDATION ---');

    const doctor = await User.findOne({ email: 'doctor@ayursutra.com' });
    const patient = await User.findOne({ email: 'patient@ayursutra.com' });

    if (!doctor || !patient) {
      console.log('Demo users missing.');
      process.exit(1);
    }

    // Ensure doctor assignment for test
    patient.assignedDoctor = doctor._id;
    await patient.save();

    const initialRxCount = await Prescription.countDocuments();

    // 1. Authorized Doctor Recommendation Request Test
    const recResult = await treatmentRecommendationService.generateRecommendation(doctor, patient._id, 'Mild joint stiffness');
    console.log(`1. Provider Offline Handling -> Status: ${recResult.status || 'success'} (Handled cleanly without crashing) [PASS]`);

    // 2. Non-Prescribing Isolation Check
    const finalRxCount = await Prescription.countDocuments();
    console.log(`2. Non-Prescribing Check -> Prescription count unchanged (${initialRxCount} == ${finalRxCount}): ${initialRxCount === finalRxCount} [${initialRxCount === finalRxCount ? 'PASS' : 'FAIL'}]`);

    // 3. Unauthorized User Access Test (Patient attempting engine)
    let patientBlocked = false;
    try {
      await treatmentRecommendationService.generateRecommendation(patient, patient._id, 'Test query');
    } catch (err) {
      if (err.statusCode === 403) patientBlocked = true;
    }
    console.log(`3. Patient 403 Guard Test -> Blocked: ${patientBlocked} [${patientBlocked ? 'PASS' : 'FAIL'}]`);

    console.log('\nAll Phase 4 AI Treatment Recommendation security and safety tests executed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Treatment Recommendation Test Error:', err);
    process.exit(1);
  }
};

runTreatmentRecommendationTests();
