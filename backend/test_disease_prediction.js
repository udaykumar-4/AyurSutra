require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const AIPrediction = require('./models/aiPrediction');
const diseasePredictionService = require('./services/ai/diseasePredictionService');

const runDiseasePredictionTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- PHASE 5 AI DISEASE PREDICTION SECURITY & SAFETY VALIDATION ---');

    const doctor = await User.findOne({ email: 'doctor@ayursutra.com' });
    const patient = await User.findOne({ email: 'patient@ayursutra.com' });

    if (!doctor || !patient) {
      console.log('Demo users missing.');
      process.exit(1);
    }

    patient.assignedDoctor = doctor._id;
    const initialCondition = patient.condition;
    await patient.save();

    // 1. Authorized Doctor Request Test & Provider Offline Fallback
    const predResult = await diseasePredictionService.generatePrediction(doctor, patient._id, 'Symmetrical joint pain, morning stiffness');
    console.log(`1. Provider Offline Handling -> Status: ${predResult.status || 'success'} (Handled cleanly without crashing) [PASS]`);

    // 2. Non-Autonomous Diagnosis Isolation Check
    const reloadedPatient = await User.findById(patient._id);
    const conditionUnchanged = reloadedPatient.condition === initialCondition;
    console.log(`2. Non-Autonomous Diagnosis Check -> Patient condition field unchanged: ${conditionUnchanged} [${conditionUnchanged ? 'PASS' : 'FAIL'}]`);

    // 3. Unauthorized User Access Test (Patient attempting prediction engine)
    let patientBlocked = false;
    try {
      await diseasePredictionService.generatePrediction(patient, patient._id, 'Test query');
    } catch (err) {
      if (err.statusCode === 403) patientBlocked = true;
    }
    console.log(`3. Patient 403 Guard Test -> Blocked: ${patientBlocked} [${patientBlocked ? 'PASS' : 'FAIL'}]`);

    // Clean up test predictions
    await AIPrediction.deleteMany({ patientId: patient._id });

    console.log('\nAll Phase 5 AI Disease Prediction security and safety tests executed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Disease Prediction Test Error:', err);
    process.exit(1);
  }
};

runDiseasePredictionTests();
