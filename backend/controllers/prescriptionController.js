const Prescription = require('../models/prescription');

// @desc    Create new prescription
// @route   POST /api/prescriptions
const createPrescription = async (req, res) => {
  try {
    const prescription = new Prescription({
      patientId: req.body.patientId,
      doctorId: req.body.doctorId,
      therapistId: req.body.therapistId,
      treatment: req.body.treatment,
      duration: req.body.duration,
      plan: req.body.plan,
      notes: req.body.notes,
    });

    const createdPrescription = await prescription.save();
    res.status(201).json(createdPrescription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// ... (createPrescription function)

// ⭐️ START: NEW FUNCTIONS

// @desc    Get a single prescription by ID
// @route   GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (prescription) {
      res.json(prescription);
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all prescriptions for a specific doctor
// @route   GET /api/prescriptions/doctor/:doctorId
const getPrescriptionsForDoctor = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'full_name')
      .populate('therapistId', 'full_name');
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getPrescriptionsForPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'full_name')
      .populate('therapistId', 'full_name');
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update prescription progress
// @route   PUT /api/prescriptions/:id/progress
const updatePrescriptionProgress = async (req, res) => {
  try {
    const { progressCompleted } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (prescription) {
      prescription.progressCompleted = progressCompleted;
      if (prescription.progressCompleted >= prescription.duration) {
        prescription.status = 'completed';
      } else {
        prescription.status = 'in-progress';
      }
      const updatedPrescription = await prescription.save();
      res.json(updatedPrescription);
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... (at the end of the file, inside module.exports)

// @desc    Get all prescriptions for a specific therapist
// @route   GET /api/prescriptions/therapist/:therapistId
const getPrescriptionsForTherapist = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ therapistId: req.params.therapistId })
      .populate('patientId', 'full_name')
      .populate('doctorId', 'full_name');
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createPrescription, 
  getPrescriptionsForPatient, 
  updatePrescriptionProgress,
  getPrescriptionById,            
  getPrescriptionsForDoctor,
  getPrescriptionsForTherapist // ⭐️ ADD THIS
};

