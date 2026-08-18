require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Appointment = require('./models/appointment');
const smartSchedulingService = require('./services/scheduling/smartSchedulingService');

const runSchedulingTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- PHASE 2 SMART SCHEDULING VALIDATION ---');

    const doctor = await User.findOne({ email: 'doctor@ayursutra.com' });
    const therapist = await User.findOne({ email: 'therapist@ayursutra.com' });
    const patient = await User.findOne({ email: 'patient@ayursutra.com' });

    if (!doctor || !therapist || !patient) {
      console.log('Demo users missing.');
      process.exit(1);
    }

    const testDate = '2026-09-01';

    // Clean test appointments
    await Appointment.deleteMany({ treatment: 'SCHEDULING_TEST' });

    // 1. Test: No conflict -> Slot accepted
    const check1 = await smartSchedulingService.checkConflict(doctor._id, testDate, '10:00 AM');
    console.log(`1. No Conflict Test -> Conflict: ${check1.hasConflict} [${!check1.hasConflict ? 'PASS' : 'FAIL'}]`);

    // Create a conflicting appointment at 10:00 AM for Doctor
    await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      treatment: 'SCHEDULING_TEST',
      appointment_date: new Date(testDate),
      appointment_time: '10:00 AM',
      status: 'scheduled'
    });

    // 2. Test: Exact conflict -> Rejected
    const check2 = await smartSchedulingService.checkConflict(doctor._id, testDate, '10:00 AM');
    console.log(`2. Exact Conflict Test -> Conflict: ${check2.hasConflict} [${check2.hasConflict ? 'PASS' : 'FAIL'}]`);

    // 3. Test: Partial overlap (10:30 AM) -> Rejected
    const check3 = await smartSchedulingService.checkConflict(doctor._id, testDate, '10:30 AM');
    console.log(`3. Partial Overlap Test -> Conflict: ${check3.hasConflict} [${check3.hasConflict ? 'PASS' : 'FAIL'}]`);

    // 4. Test: Session ending exactly when another starts (11:00 AM) -> Accepted
    const check4 = await smartSchedulingService.checkConflict(doctor._id, testDate, '11:00 AM');
    console.log(`4. Session Adjacent Test (11:00 AM) -> Conflict: ${check4.hasConflict} [${!check4.hasConflict ? 'PASS' : 'FAIL'}]`);

    // 5. Test: Parallel booking for different staff (Therapist at 10:00 AM) -> Allowed
    const check5 = await smartSchedulingService.checkConflict(therapist._id, testDate, '10:00 AM');
    console.log(`5. Different Staff Parallel Test -> Conflict: ${check5.hasConflict} [${!check5.hasConflict ? 'PASS' : 'FAIL'}]`);

    // 6. Test: Outside working hours (07:00 AM) -> Rejected
    const check6 = await smartSchedulingService.checkConflict(doctor._id, testDate, '07:00 AM');
    console.log(`6. Outside Working Hours Test -> Conflict: ${check6.hasConflict} [${check6.hasConflict ? 'PASS' : 'FAIL'}]`);

    // 7. Test: Ranked recommendations generation
    const recs = await smartSchedulingService.getRecommendations(doctor._id, testDate, '10:00 AM');
    console.log(`7. Recommendations Generated -> Count: ${recs.recommendedSlots.length}, Top Slot: ${recs.recommendedSlots[0]?.time} (${recs.recommendedSlots[0]?.score} pts) [${recs.recommendedSlots.length > 0 ? 'PASS' : 'FAIL'}]`);

    // Clean test appointments
    await Appointment.deleteMany({ treatment: 'SCHEDULING_TEST' });

    console.log('\nAll Phase 2 scheduling validation checks executed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Scheduling Test Error:', err);
    process.exit(1);
  }
};

runSchedulingTests();
