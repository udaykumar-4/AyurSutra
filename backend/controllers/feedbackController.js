const Feedback = require('../models/feedback');
const User = require('../models/user');
const Prescription = require('../models/prescription');

// @desc    Create new feedback
// @route   POST /api/feedback
const createFeedback = async (req, res) => {
  try {
    const { 
      doctorRating, doctorFeedback,
      therapistRating, therapistFeedback,
      overallRating, overallFeedback 
    } = req.body;

    // Get patient's info
    const patient = await User.findById(req.user._id);
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }

    // Find patient's active therapist from their prescription
    const prescription = await Prescription.findOne({ 
      patientId: req.user._id, 
      status: 'in-progress' 
    });

    const newFeedback = new Feedback({
      patientId: req.user._id,
      doctorId: patient.assignedDoctor || null,
      therapistId: prescription ? prescription.therapistId : null,
      doctorRating,
      doctorFeedback,
      therapistRating,
      therapistFeedback,
      overallRating,
      overallFeedback
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all feedback for a specific doctor
// @route   GET /api/feedback/doctor
const getFeedbackForDoctor = async (req, res) => {
  try {
    const feedback = await Feedback.find({ doctorId: req.user._id })
      .populate('patientId', 'full_name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all feedback for a specific therapist
// @route   GET /api/feedback/therapist
const getFeedbackForTherapist = async (req, res) => {
  try {
    const feedback = await Feedback.find({ therapistId: req.user._id })
      .populate('patientId', 'full_name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createFeedback, 
  getFeedbackForDoctor, 
  getFeedbackForTherapist 
};