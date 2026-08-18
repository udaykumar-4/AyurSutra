require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Appointment = require('./models/appointment');
const Prescription = require('./models/prescription');
const Feedback = require('./models/feedback');
const AIAuditLog = require('./models/aiAuditLog');
const outcomeAnalyticsService = require('./services/analytics/outcomeAnalyticsService');

const runValidation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- PHASE 1 DETAILED ANALYTICS DATA VALIDATION ---');

    // 1. Fetch Demo Users
    const demoPatient = await User.findOne({ email: 'patient@ayursutra.com' });
    const demoDoctor = await User.findOne({ email: 'doctor@ayursutra.com' });
    const demoTherapist = await User.findOne({ email: 'therapist@ayursutra.com' });

    if (!demoPatient || !demoDoctor || !demoTherapist) {
      console.log('Demo accounts not fully seeded.');
      process.exit(1);
    }

    // 2. Clean temporary test records if any
    await Appointment.deleteMany({ treatment: 'TEST_ANALYTICS_VALIDATION' });
    await Prescription.deleteMany({ treatment: 'TEST_ANALYTICS_VALIDATION' });
    await Feedback.deleteMany({ overallFeedback: 'TEST_ANALYTICS_VALIDATION' });

    // 3. Create Controlled Test Records
    // 2 Appointments: 1 completed, 1 scheduled
    await Appointment.create({
      patientId: demoPatient._id,
      doctorId: demoDoctor._id,
      therapistId: demoTherapist._id,
      treatment: 'TEST_ANALYTICS_VALIDATION',
      appointment_date: new Date(),
      appointment_time: '10:00 AM',
      status: 'completed',
      cost: 1500,
      isPaid: true
    });

    await Appointment.create({
      patientId: demoPatient._id,
      doctorId: demoDoctor._id,
      therapistId: demoTherapist._id,
      treatment: 'TEST_ANALYTICS_VALIDATION',
      appointment_date: new Date(),
      appointment_time: '02:00 PM',
      status: 'scheduled',
      cost: 1500,
      isPaid: false
    });

    // 1 Prescription: 10 sessions total, 6 completed
    await Prescription.create({
      patientId: demoPatient._id,
      doctorId: demoDoctor._id,
      therapistId: demoTherapist._id,
      treatment: 'TEST_ANALYTICS_VALIDATION',
      duration: 10,
      progressCompleted: 6,
      plan: 'Abhyanga + Swedana',
      status: 'in-progress'
    });

    // 1 Feedback record: Doctor rating 5, Therapist rating 4, Overall 5
    await Feedback.create({
      patientId: demoPatient._id,
      doctorId: demoDoctor._id,
      therapistId: demoTherapist._id,
      doctorRating: 5,
      doctorFeedback: 'Excellent care',
      therapistRating: 4,
      therapistFeedback: 'Great session',
      overallRating: 5,
      overallFeedback: 'TEST_ANALYTICS_VALIDATION'
    });

    // 4. Calculate Expected Controlled Values
    // Patient Controlled Metrics:
    // Appointments: 2 total, 1 completed, 0 cancelled
    // Prescribed Sessions: 10 total, 6 completed -> Adherence: Math.round((6/10)*100) = 60%
    const expTotalAppts = 2;
    const expCompletedAppts = 1;
    const expPrescribedSessions = 10;
    const expCompletedSessions = 6;
    const expAdherence = 60;

    // Fetch Actual Outcomes from Service
    const patientActual = await outcomeAnalyticsService.getPatientOutcomes(demoPatient._id);

    console.log('\n==================================================');
    console.log('1. DATA CORRECTNESS MATRIX (Controlled Dataset)');
    console.log('==================================================');
    console.log(`Total Appointments -> Expected: ${expTotalAppts}, Actual: ${patientActual.operational.totalAppointments} [${expTotalAppts === patientActual.operational.totalAppointments ? 'PASS' : 'FAIL'}]`);
    console.log(`Completed Appointments -> Expected: ${expCompletedAppts}, Actual: ${patientActual.operational.completedAppointments} [${expCompletedAppts === patientActual.operational.completedAppointments ? 'PASS' : 'FAIL'}]`);
    console.log(`Prescribed Sessions -> Expected: ${expPrescribedSessions}, Actual: ${patientActual.adherence.totalPrescribedSessions} [${expPrescribedSessions === patientActual.adherence.totalPrescribedSessions ? 'PASS' : 'FAIL'}]`);
    console.log(`Completed Sessions -> Expected: ${expCompletedSessions}, Actual: ${patientActual.adherence.totalCompletedSessions} [${expCompletedSessions === patientActual.adherence.totalCompletedSessions ? 'PASS' : 'FAIL'}]`);
    console.log(`Adherence Rate -> Expected: ${expAdherence}%, Actual: ${patientActual.adherence.adherenceRate}% [${expAdherence === patientActual.adherence.adherenceRate ? 'PASS' : 'FAIL'}]`);

    // Clean up test records
    await Appointment.deleteMany({ treatment: 'TEST_ANALYTICS_VALIDATION' });
    await Prescription.deleteMany({ treatment: 'TEST_ANALYTICS_VALIDATION' });
    await Feedback.deleteMany({ overallFeedback: 'TEST_ANALYTICS_VALIDATION' });

    console.log('\nTest records cleaned up successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Validation Error:', err);
    process.exit(1);
  }
};

runValidation();
