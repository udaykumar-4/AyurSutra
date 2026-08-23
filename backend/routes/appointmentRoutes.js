const express = require('express');
const router = express.Router();

const { 
  getAvailability,
  createAppointment, 
  getAppointments, 
  getAppointmentById, 
  updateAppointmentStatus, 
  deleteAppointment,
  markAppointmentAsPaid
} = require('../controllers/appointmentsController');

const { protect } = require('../middleware/authMiddleware');

// GET /api/appointments/availability
router.get('/availability', protect, getAvailability);

// GET /api/appointments
// POST /api/appointments
router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

// GET /api/appointments/:id
// DELETE /api/appointments/:id
router.route('/:id')
  .get(protect, getAppointmentById)
  .delete(protect, deleteAppointment);

// PUT /api/appointments/:id/status
router.route('/:id/status')
  .put(protect, updateAppointmentStatus);

// PUT /api/appointments/:id/pay
router.route('/:id/pay')
  .put(protect, markAppointmentAsPaid);

module.exports = router;