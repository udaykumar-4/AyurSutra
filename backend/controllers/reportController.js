const User = require('../models/user');
const Appointment = require('../models/appointment');
const Prescription = require('../models/prescription');
const Note = require('../models/note');

// @desc    Generate a full report for a single patient
// @route   GET /api/reports/patient/:patientId
const getPatientReport = async (req, res) => {
  try {
    const { patientId } = req.params;
    

    // 1. Get User Details
    const user = await User.findById(patientId)
      .populate('assignedDoctor', 'full_name');

    if (!user || user.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2. Get Appointments
    const appointments = await Appointment.find({ patientId: patientId })
      .populate('doctorId', 'full_name')
      .populate('therapistId', 'full_name')
      .sort({ appointment_date: -1 });

    // 3. Get Prescriptions
    const prescriptions = await Prescription.find({ patientId: patientId })
      .populate('doctorId', 'full_name')
      .populate('therapistId', 'full_name')
      .sort({ createdAt: -1 });

    // 4. Get Notes
    const notes = await Note.find({ patientId: patientId })
      .populate('authorId', 'full_name role')
      .sort({ createdAt: -1 });

    // 5. Bundle and send the report
    res.json({
      user,
      appointments,
      prescriptions,
      notes
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getMyReport = async (req, res) => {
  try {
    const patientId = req.user._id; // Get ID from the logged-in user

    // 1. Get User Details
    const user = await User.findById(patientId)
      .populate('assignedDoctor', 'full_name');

    // 2. Get Appointments
    const appointments = await Appointment.find({ patientId: patientId })
      .populate('doctorId', 'full_name')
      .populate('therapistId', 'full_name')
      .sort({ appointment_date: -1 });

    // 3. Get Prescriptions
    const prescriptions = await Prescription.find({ patientId: patientId })
      .populate('doctorId', 'full_name')
      .populate('therapistId', 'full_name')
      .sort({ createdAt: -1 });

    // 4. Get Notes
    const notes = await Note.find({ patientId: patientId })
      .populate('authorId', 'full_name role')
      .sort({ createdAt: -1 });

    // 5. Bundle and send the report
    res.json({
      user,
      appointments,
      prescriptions,
      notes
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { 
    getPatientReport,
    getMyReport
};