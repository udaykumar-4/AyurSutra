const express = require('express');
const router = express.Router();
const { getNotesForPatient, createNote } = require('../controllers/noteController');
// ⭐️ Import our new middleware
const { protect, therapistOrDoctor } = require('../middleware/authMiddleware');

// Anyone logged in can get notes
router.get('/patient/:patientId', protect, getNotesForPatient);

// ⭐️ Only a DOCTOR or THERAPIST can create
router.post('/', protect, therapistOrDoctor, createNote);

module.exports = router;