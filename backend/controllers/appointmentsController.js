const Appointment = require('../models/appointment');
const User = require('../models/user'); 

// @desc    Create new appointment
// @route   POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const { 
      patientId, 
      therapistId, 
      doctorId, 
      treatment, 
      appointment_date, 
      appointment_time 
    } = req.body;

    // --- 1. Availability Check ---
    const staffId = doctorId || therapistId;
    
    if (staffId) {
      // A. Check if the staff member already has an appointment at this time
      const existingAppointment = await Appointment.findOne({
        $or: [{ doctorId: staffId }, { therapistId: staffId }],
        appointment_date: new Date(appointment_date),
        appointment_time: appointment_time
      });

      if (existingAppointment) {
        return res.status(409).json({ message: 'This time slot is already booked. Please choose another time.' });
      }

      // B. Check if the staff member has blocked this time in their profile
      const staffMember = await User.findById(staffId);
      const isBlocked = staffMember.blockedSlots.some(slot => {
        // Compare date part only (ignoring timezones) and the time string
        const slotDateStr = slot.date.toISOString().split('T')[0];
        const apptDateStr = new Date(appointment_date).toISOString().split('T')[0];
        return slotDateStr === apptDateStr && slot.time === appointment_time;
      });

      if (isBlocked) {
        return res.status(409).json({ message: 'The provider is not available at this time. Please choose another slot.' });
      }
    }

    // --- 2. Cost / Pricing Logic ---
    // Define the specific cost for each treatment type
    const treatmentCosts = {
        'Consultation': 500,     
        'Abhyanga': 2000,        
        'Shirodhara': 2500,      
        'Swedana': 1500,         
        'Pizhichil': 3000        
    };

    // Use the specific cost, or default to 1500 if the treatment isn't listed
    let finalCost = treatmentCosts[treatment] || 1500;

    const appointment = new Appointment({
      patientId,
      therapistId,
      doctorId,
      treatment,
      appointment_date,
      appointment_time,
      cost: finalCost // Save the calculated cost
    });

    const createdAppointment = await appointment.save();
    res.status(201).json(createdAppointment);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
const getAppointments = async (req, res) => {
  try {
    // Filter based on who is asking (patient, doctor, or therapist)
    const filter = {};
    if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }
    if (req.query.doctorId) {
      filter.doctorId = req.query.doctorId;
    }
    if (req.query.therapistId) {
      filter.therapistId = req.query.therapistId;
    }
    
    const appointments = await Appointment.find(filter)
      .populate('patientId', 'full_name') 
      .populate('therapistId', 'full_name')
      .populate('doctorId', 'full_name')
      .sort({ appointment_date: -1 }); // Sort by newest first
      
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'full_name') 
      .populate('therapistId', 'full_name') 
      .populate('doctorId', 'full_name'); 

    if (appointment) {
      res.json(appointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.status = status;
      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (appointment) {
      await appointment.deleteOne();
      res.json({ message: 'Appointment removed' });
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark appointment as paid
// @route   PUT /api/appointments/:id/pay
const markAppointmentAsPaid = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.isPaid = true;
      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createAppointment, 
  getAppointments, 
  getAppointmentById, 
  updateAppointmentStatus, 
  deleteAppointment,
  markAppointmentAsPaid
};