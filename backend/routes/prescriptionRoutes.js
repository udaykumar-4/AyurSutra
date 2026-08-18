const express = require('express');
const router = express.Router();
const { 
  createPrescription, 
  getPrescriptionsForPatient, 
  updatePrescriptionProgress,
  getPrescriptionById,
  getPrescriptionsForDoctor,
  getPrescriptionsForTherapist
} = require('../controllers/prescriptionController');
// ⭐️ Import all our new middleware
const { protect, doctor, therapistOrDoctor } = require('../middleware/authMiddleware');

// ⭐️ Only a DOCTOR can create
router.post('/', protect, doctor, createPrescription);

// ⭐️ Only a DOCTOR or THERAPIST can update
router.put('/:id/progress', protect, therapistOrDoctor, updatePrescriptionProgress);

// Anyone logged in can view these (patients, doctors, etc.)
router.get('/patient/:patientId', protect, getPrescriptionsForPatient);
router.get('/:id', protect, getPrescriptionById);
router.get('/doctor/:doctorId', protect, getPrescriptionsForDoctor);
router.get('/therapist/:therapistId', protect, getPrescriptionsForTherapist);

module.exports = router;