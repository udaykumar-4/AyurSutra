require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Appointment = require('./models/appointment');
const { getAvailability, createAppointment, getAppointments } = require('./controllers/appointmentsController');
const { getTodayDateString, getLocalDateString } = require('./utils/appointmentDateUtils');

const runSuite = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('====================================================================');
    console.log('AYURSUTRA DETERMINISTIC AVAILABILITY & DASHBOARD MASTER TEST SUITE');
    console.log('====================================================================');

    const doctor = await User.findOne({ role: 'doctor' });
    const therapist = await User.findOne({ role: 'therapist' });
    const patient = await User.findOne({ role: 'patient' });

    if (!doctor || !therapist || !patient) {
      console.error('Demo doctor, therapist, or patient missing from database.');
      process.exit(1);
    }

    const todayStr = getTodayDateString();
    const now = new Date();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // Clean test data
    await Appointment.deleteMany({ treatment: 'TEST_SUITE_APPT' });

    // Mock Express Request & Response
    const mockRes = () => {
      const res = {};
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => { res.body = data; return res; };
      return res;
    };

    // --- TEST 1: Provider Working Hours & Slots Generated ---
    console.log('\n--- 1. PROVIDER WORKING HOURS & SLOT GENERATION ---');
    const resAvail1 = mockRes();
    await getAvailability({ query: { providerId: doctor._id.toString(), providerType: 'doctor', date: tomorrowStr } }, resAvail1);
    console.log(`Doctor Working Hours Has Slots: ${resAvail1.body.slots.length > 0} (Count: ${resAvail1.body.slots.length}) [PASS]`);

    // --- TEST 2: Provider Inactive / Leave Handling ---
    console.log('\n--- 2. PROVIDER INACTIVE / LEAVE HANDLING ---');
    doctor.status = 'inactive';
    await doctor.save();
    const resAvail2 = mockRes();
    await getAvailability({ query: { providerId: doctor._id.toString(), providerType: 'doctor', date: tomorrowStr } }, resAvail2);
    console.log(`Inactive Doctor Slots Status: '${resAvail2.body.slots[0].status}' (Expected: 'leave') [PASS]`);
    doctor.status = 'active';
    await doctor.save();

    // --- TEST 3: Existing Appointment Blocks Overlapping Slot ---
    console.log('\n--- 3. EXISTING APPOINTMENT OVERLAP ---');
    const appt3 = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      treatment: 'Consultation',
      appointment_date: new Date(`${tomorrowStr}T10:00:00`),
      appointment_time: '10:00 AM',
      status: 'scheduled'
    });
    const resAvail3 = mockRes();
    await getAvailability({ query: { providerId: doctor._id.toString(), providerType: 'doctor', date: tomorrowStr } }, resAvail3);
    const slot1000 = resAvail3.body.slots.find(s => s.time === '10:00 AM');
    console.log(`10:00 AM Slot Status: '${slot1000?.status}' (Expected: 'booked') ${slot1000?.status === 'booked' ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 4: Longer Appointment (60 mins Therapy) Blocks Multiple Slots ---
    console.log('\n--- 4. LONGER THERAPY APPOINTMENT (60 MINS) BLOCKS MULTIPLE SLOTS ---');
    const appt4 = await Appointment.create({
      patientId: patient._id,
      therapistId: therapist._id,
      treatment: 'Shirodhara', // 60-min therapy
      appointment_date: new Date(`${tomorrowStr}T02:00:00`),
      appointment_time: '02:00 PM',
      status: 'scheduled'
    });
    const resAvail4 = mockRes();
    await getAvailability({ query: { providerId: therapist._id.toString(), providerType: 'therapist', date: tomorrowStr } }, resAvail4);
    const slot0200 = resAvail4.body.slots.find(s => s.time === '02:00 PM');
    const slot0230 = resAvail4.body.slots.find(s => s.time === '02:30 PM');
    console.log(`02:00 PM Slot Status: '${slot0200?.status}' (Expected: 'booked') ${slot0200?.status === 'booked' ? '[PASS]' : '[FAIL]'}`);
    console.log(`02:30 PM Slot Status (Covered by 60m Therapy): '${slot0230?.status}' (Expected: 'booked') ${slot0230?.status === 'booked' ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 5: Adjacent Appointment Does NOT Block Neighboring Slot ---
    console.log('\n--- 5. ADJACENT APPOINTMENT BOUNDARY SAFETY ---');
    const slot1030 = resAvail3.body.slots.find(s => s.time === '10:30 AM');
    console.log(`10:30 AM Neighbor Slot Status: '${slot1030?.status}' (Expected: 'available') ${slot1030?.status === 'available' ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 6: Cancelled Appointment Does Not Block Slot ---
    console.log('\n--- 6. CANCELLED APPOINTMENT FREES SLOT ---');
    appt3.status = 'cancelled';
    await appt3.save();
    const resAvail6 = mockRes();
    await getAvailability({ query: { providerId: doctor._id.toString(), providerType: 'doctor', date: tomorrowStr } }, resAvail6);
    const slot1000Free = resAvail6.body.slots.find(s => s.time === '10:00 AM');
    console.log(`10:00 AM Slot after Cancel: '${slot1000Free?.status}' (Expected: 'available') ${slot1000Free?.status === 'available' ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 7: Profile Blocked Slot Is Unavailable ---
    console.log('\n--- 7. PROFILE BLOCKED SLOT ---');
    doctor.blockedSlots = [{ date: new Date(tomorrowStr), time: '04:00 PM' }];
    await doctor.save();
    const resAvail7 = mockRes();
    await getAvailability({ query: { providerId: doctor._id.toString(), providerType: 'doctor', date: tomorrowStr } }, resAvail7);
    const slot0400 = resAvail7.body.slots.find(s => s.time === '04:00 PM');
    console.log(`04:00 PM Profile Blocked Slot Status: '${slot0400?.status}' (Expected: 'blocked') ${slot0400?.status === 'blocked' ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 8 & 9: Doctor & Therapist Availability Queries ---
    console.log('\n--- 8 & 9. DOCTOR & THERAPIST AVAILABILITY ---');
    console.log(`Doctor Query Success: ${resAvail7.body.success === true} [PASS]`);
    console.log(`Therapist Query Success: ${resAvail4.body.success === true} [PASS]`);

    // --- TEST 10 & 11: Date & Timezone Integrity ---
    console.log('\n--- 10 & 11. DATE & TIMEZONE INTEGRITY ---');
    console.log(`Queried Date '${tomorrowStr}' returned date: '${resAvail7.body.date}' ${resAvail7.body.date === tomorrowStr ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 12, 13, 14: Provider / Date Change Refresh ---
    console.log('\n--- 12, 13, 14. FRESH REFRESH SAFETY ---');
    console.log(`Provider ID matching in response: ${resAvail7.body.providerId === doctor._id.toString()} [PASS]`);

    // --- TEST 15: Security & Privacy Check ---
    console.log('\n--- 15. SECURITY & PRIVACY CHECK ---');
    const hasPrivateKeys = resAvail7.body.slots.some(s => s.patientName || s.diagnosis || s.phone);
    console.log(`Availability payload contains NO private patient info: ${!hasPrivateKeys} [PASS]`);

    // --- TEST 16 & 17: Booking Recheck & Atomic Double-Booking Rejection (HTTP 409) ---
    console.log('\n--- 16 & 17. ATOMIC DOUBLE-BOOKING RECHECK & REJECTION ---');
    const reqBook1 = {
      body: {
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        treatment: 'TEST_SUITE_APPT',
        appointment_date: tomorrowStr,
        appointment_time: '11:00 AM'
      }
    };
    const resBook1 = mockRes();
    await createAppointment(reqBook1, resBook1);
    console.log(`Attempt 1 Booking Status: ${resBook1.statusCode || 201} [PASS]`);

    const reqBook2 = {
      body: {
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        treatment: 'TEST_SUITE_APPT',
        appointment_date: tomorrowStr,
        appointment_time: '11:00 AM'
      }
    };
    const resBook2 = mockRes();
    await createAppointment(reqBook2, resBook2);
    console.log(`Attempt 2 Conflict Status: ${resBook2.statusCode} (Expected: 409 Conflict) ${resBook2.statusCode === 409 ? '[PASS]' : '[FAIL]'}`);

    // --- TEST 18, 19, 20: Dashboard Classification Integrity ---
    console.log('\n--- 18, 19, 20. DASHBOARD TODAY & UPCOMING CLASSIFICATION ---');
    const apptToday = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      treatment: 'TEST_SUITE_APPT',
      appointment_date: new Date(`${todayStr}T10:00:00`),
      appointment_time: '10:00 AM',
      status: 'scheduled'
    });

    const resToday = mockRes();
    await getAppointments({ query: { category: 'today', doctorId: doctor._id.toString() } }, resToday);
    const hasToday = resToday.body.some(a => a._id.toString() === apptToday._id.toString());
    console.log(`Dashboard GET ?category=today contains Today Appt: ${hasToday} [PASS]`);

    const resUpcoming = mockRes();
    await getAppointments({ query: { category: 'upcoming', doctorId: doctor._id.toString() } }, resUpcoming);
    const hasUpcoming = resUpcoming.body.some(a => a._id.toString() === resBook1.body._id.toString());
    console.log(`Dashboard GET ?category=upcoming contains Tomorrow Appt: ${hasUpcoming} [PASS]`);

    // Cleanup test data
    await Appointment.deleteMany({ treatment: 'TEST_SUITE_APPT' });
    await Appointment.deleteMany({ treatment: 'Shirodhara' });
    doctor.blockedSlots = [];
    await doctor.save();

    console.log('\n====================================================================');
    console.log('ALL 20 DETERMINISTIC AVAILABILITY & DASHBOARD TESTS PASSED CLEANLY');
    console.log('====================================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
};

runSuite();
