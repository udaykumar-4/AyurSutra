const recommendationEngine = require('../services/ai/patient-treatment-recommendation');
const PatientTreatmentRecommendation = require('../models/patientTreatmentRecommendation');
const AIAuditLog = require('../models/aiAuditLog');

// @desc    Generate isolated educational AI treatment recommendation for patient
// @route   POST /api/ai/patient-treatment-recommendations
// @access  Private (Patient only for self)
const generateRecommendation = async (req, res) => {
  try {
    // 1. Role Guard: Patients ONLY
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized for patient treatment recommendations. Access restricted to patients only.' });
    }

    // 2. Patient IDOR Guard: Requesting patient MUST match authenticated user
    if (req.body.patientId && req.body.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate treatment recommendations for another patient' });
    }

    const { symptoms, quickSelections } = req.body;
    const symptomsText = symptoms || '';

    // 3. Process Recommendation via Isolated Engine
    const result = await recommendationEngine.processRecommendation(req.user._id, symptomsText, quickSelections || []);

    // 4. Save to isolated collection if successful recommendation generated
    if (result.success && result.recommendations && result.recommendations.length > 0) {
      const record = await PatientTreatmentRecommendation.create({
        patientId: req.user._id,
        symptoms: symptomsText || (quickSelections || []).join(', ') || 'General Wellness Query',
        quickSelections: quickSelections || [],
        recommendations: result.recommendations,
        safetyWarnings: result.safetyWarnings || [],
        contraindications: result.contraindications || [],
        classicalReferences: result.classicalReferences || [],
        educationalOnly: true,
        requiresClinicianReview: true,
        disclaimer: result.disclaimer
      });

      // Audit logging
      await AIAuditLog.create({
        userId: req.user._id,
        role: req.user.role,
        action: 'AI_PATIENT_TREATMENT_RECOMMENDATION_GENERATE',
        targetPatientId: req.user._id,
        metadata: { recommendationId: record._id }
      });

      result.recommendationId = record._id;
    }

    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Failed to process AI treatment recommendation' });
  }
};

// @desc    Get recommendation history for authenticated patient
// @route   GET /api/ai/patient-treatment-recommendations
// @access  Private (Patient only for self)
const getPatientRecommendations = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized for patient treatment recommendations.' });
    }

    const history = await PatientTreatmentRecommendation.find({ patientId: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single recommendation record by ID with strict IDOR ownership check
// @route   GET /api/ai/patient-treatment-recommendations/:id
// @access  Private (Patient only for self)
const getPatientRecommendationById = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Not authorized for patient treatment recommendations.' });
    }

    const record = await PatientTreatmentRecommendation.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Recommendation record not found' });
    }

    // Strict IDOR Ownership Check
    if (record.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access another patient\'s treatment recommendations' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateRecommendation,
  getPatientRecommendations,
  getPatientRecommendationById
};
