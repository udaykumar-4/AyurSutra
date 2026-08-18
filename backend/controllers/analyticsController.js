const outcomeAnalyticsService = require('../services/analytics/outcomeAnalyticsService');
const AIAuditLog = require('../models/aiAuditLog');
const User = require('../models/user');
const Prescription = require('../models/prescription');
const Appointment = require('../models/appointment');

// @desc    Get Clinic-Wide Global Outcomes (Admin Only)
// @route   GET /api/analytics/outcomes
const getGlobalOutcomes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as an admin for clinic-wide analytics' });
    }

    const data = await outcomeAnalyticsService.getGlobalOutcomes();

    // Audit log
    await AIAuditLog.create({
      userId: req.user._id,
      role: req.user.role,
      action: 'GET_GLOBAL_OUTCOME_ANALYTICS',
      ipAddress: req.ip
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Doctor Assigned Patient Outcomes
// @route   GET /api/analytics/outcomes/doctor
const getDoctorOutcomes = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for doctor outcome analytics' });
    }

    const doctorId = req.user.role === 'admin' && req.query.doctorId ? req.query.doctorId : req.user._id;
    const data = await outcomeAnalyticsService.getDoctorOutcomes(doctorId);

    await AIAuditLog.create({
      userId: req.user._id,
      role: req.user.role,
      action: 'GET_DOCTOR_OUTCOME_ANALYTICS',
      ipAddress: req.ip
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Therapist Assigned Patient Outcomes
// @route   GET /api/analytics/outcomes/therapist
const getTherapistOutcomes = async (req, res) => {
  try {
    if (req.user.role !== 'therapist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for therapist outcome analytics' });
    }

    const therapistId = req.user.role === 'admin' && req.query.therapistId ? req.query.therapistId : req.user._id;
    const data = await outcomeAnalyticsService.getTherapistOutcomes(therapistId);

    await AIAuditLog.create({
      userId: req.user._id,
      role: req.user.role,
      action: 'GET_THERAPIST_OUTCOME_ANALYTICS',
      ipAddress: req.ip
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Patient Outcomes (Strict Authorization Enforcement)
// @route   GET /api/analytics/outcomes/patient
const getPatientOutcomes = async (req, res) => {
  try {
    let targetPatientId;

    if (req.user.role === 'patient') {
      // 🔒 PATIENT ROLE: Force query to own ID. Ignore any query params from client!
      targetPatientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      // 🔒 DOCTOR ROLE: Must be assigned/authorized patient
      const requestedId = req.query.patientId;
      if (!requestedId) {
        return res.status(400).json({ message: 'Patient ID is required' });
      }

      const patientUser = await User.findById(requestedId);
      if (!patientUser) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Check assignment or past doctor relationship
      const isAssigned = patientUser.assignedDoctor && patientUser.assignedDoctor.toString() === req.user._id.toString();
      const hasPrescription = await Prescription.exists({ patientId: requestedId, doctorId: req.user._id });
      const hasAppointment = await Appointment.exists({ patientId: requestedId, doctorId: req.user._id });

      if (!isAssigned && !hasPrescription && !hasAppointment) {
        return res.status(403).json({ message: 'Not authorized to access analytics for this patient' });
      }

      targetPatientId = requestedId;
    } else if (req.user.role === 'therapist') {
      // 🔒 THERAPIST ROLE: Must be assigned therapist
      const requestedId = req.query.patientId;
      if (!requestedId) {
        return res.status(400).json({ message: 'Patient ID is required' });
      }

      const hasPrescription = await Prescription.exists({ patientId: requestedId, therapistId: req.user._id });
      const hasAppointment = await Appointment.exists({ patientId: requestedId, therapistId: req.user._id });

      if (!hasPrescription && !hasAppointment) {
        return res.status(403).json({ message: 'Not authorized to access analytics for this patient' });
      }

      targetPatientId = requestedId;
    } else if (req.user.role === 'admin') {
      // 🔒 ADMIN ROLE: Admin should use /outcomes for clinic aggregations. Individual patient analytics restricted unless specified.
      const requestedId = req.query.patientId;
      if (!requestedId) {
        return res.status(400).json({ message: 'Patient ID is required for administrative lookup' });
      }
      targetPatientId = requestedId;
    } else {
      return res.status(403).json({ message: 'Not authorized for patient outcome analytics' });
    }

    const data = await outcomeAnalyticsService.getPatientOutcomes(targetPatientId);

    await AIAuditLog.create({
      userId: req.user._id,
      role: req.user.role,
      action: 'GET_PATIENT_OUTCOME_ANALYTICS',
      targetPatientId,
      ipAddress: req.ip
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGlobalOutcomes,
  getDoctorOutcomes,
  getTherapistOutcomes,
  getPatientOutcomes
};
