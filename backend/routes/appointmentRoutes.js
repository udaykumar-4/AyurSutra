const express = require('express');
const router = express.Router();

const { 
  createAppointment, 
  getAppointments, 
  getAppointmentById, 
  updateAppointmentStatus, 
  deleteAppointment,
  markAppointmentAsPaid
} = require('../controllers/appointmentsController'); // ✅ This is the corrected line

const { protect } = require('../middleware/authMiddleware');

// GET /api/appointments
// POST /api/appointments
router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

// GET /api/appointments/:id
router.route('/:id')
  .get(protect, getAppointmentById)
  .delete(protect, deleteAppointment);

// PUT /api/appointments/:id/status
router.route('/:id/status')
  .put(protect, updateAppointmentStatus);
router.route('/:id/pay')
  .put(protect, markAppointmentAsPaid);

module.exports = router;