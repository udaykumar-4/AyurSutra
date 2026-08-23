const Appointment = require('../models/appointment');
const User = require('../models/user');
const Prescription = require('../models/prescription');

// Helpers for timezone-safe date extraction
const getLocalDateStr = (d) => {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d.trim())) {
    return d.trim().substring(0, 10);
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Time conversion and interval overlap utilities
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 540;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const rawTime = clean.replace('AM', '').replace('PM', '').trim();
  const parts = rawTime.split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatMinutesToTimeStr = (mins) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  const hStr = String(h).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  return `${hStr}:${mStr} ${period}`;
};

const isOverlapping = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

// Standard candidate slot grid (30-minute intervals during clinic hours)
const CANDIDATE_SLOTS = [
  { start: '09:00 AM', end: '09:30 AM', startMins: 540, endMins: 570 },
  { start: '09:30 AM', end: '10:00 AM', startMins: 570, endMins: 600 },
  { start: '10:00 AM', end: '10:30 AM', startMins: 600, endMins: 630 },
  { start: '10:30 AM', end: '11:00 AM', startMins: 630, endMins: 660 },
  { start: '11:00 AM', end: '11:30 AM', startMins: 660, endMins: 690 },
  { start: '11:30 AM', end: '12:00 PM', startMins: 690, endMins: 720 },
  { start: '12:00 PM', end: '12:30 PM', startMins: 720, endMins: 750 },
  { start: '02:00 PM', end: '02:30 PM', startMins: 840, endMins: 870 },
  { start: '02:30 PM', end: '03:00 PM', startMins: 870, endMins: 900 },
  { start: '03:00 PM', end: '03:30 PM', startMins: 900, endMins: 930 },
  { start: '03:30 PM', end: '04:00 PM', startMins: 930, endMins: 960 },
  { start: '04:00 PM', end: '04:30 PM', startMins: 960, endMins: 990 },
  { start: '04:30 PM', end: '05:00 PM', startMins: 990, endMins: 1020 }
];

// @desc    Get real-time provider availability for date using interval overlap logic
// @route   GET /api/appointments/availability
const getAvailability = async (req, res) => {
  try {
    const { providerId, providerType, date } = req.query;

    if (!providerId || !date) {
      return res.status(400).json({ message: 'providerId and date query parameters are required' });
    }

    const dateStr = getLocalDateStr(date);
    const todayStr = getTodayDateStr();

    // Check if provider exists
    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if date is in the past
    const isPastDate = dateStr < todayStr;
    const isInactiveOrOnLeave = provider.status === 'inactive' || provider.isOnLeave === true;

    // Fetch existing non-cancelled appointments for provider
    const providerAppointments = await Appointment.find({
      $or: [{ doctorId: providerId }, { therapistId: providerId }],
      status: { $ne: 'cancelled' }
    });

    const existingAppointments = providerAppointments.filter(appt => {
      return getLocalDateStr(appt.appointment_date) === dateStr;
    });

    // Extract provider blocked slots for target date
    const blockedSlotsForDate = [];
    if (provider.blockedSlots && provider.blockedSlots.length > 0) {
      provider.blockedSlots.forEach(slot => {
        const slotDateStr = getLocalDateStr(slot.date);
        if (slotDateStr === dateStr) {
          const startMins = parseTimeToMinutes(slot.time);
          blockedSlotsForDate.push({ startMins, endMins: startMins + 30, timeStr: slot.time });
        }
      });
    }

    // Process candidate slots using Interval Overlap logic
    const slots = CANDIDATE_SLOTS.map(cand => {
      let status = 'available';

      if (isPastDate) {
        status = 'past';
      } else if (isInactiveOrOnLeave) {
        status = 'leave';
      } else {
        // 1. Check interval overlap with existing active appointments
        const hasApptOverlap = existingAppointments.some(appt => {
          const apptStartMins = parseTimeToMinutes(appt.appointment_time);
          const duration = appt.treatment === 'Consultation' ? 30 : 60;
          const apptEndMins = apptStartMins + duration;
          return apptStartMins === cand.startMins || isOverlapping(apptStartMins, apptEndMins, cand.startMins, cand.endMins);
        });

        if (hasApptOverlap) {
          status = 'booked';
        } else {
          // 2. Check overlap with provider blocked slots
          const hasBlockedOverlap = blockedSlotsForDate.some(blocked => {
            return isOverlapping(blocked.startMins, blocked.endMins, cand.startMins, cand.endMins);
          });

          if (hasBlockedOverlap) {
            status = 'blocked';
          }
        }
      }

      return {
        time: cand.start,
        start: cand.start,
        end: cand.end,
        status: status
      };
    });

    const hasWorkingHours = !isInactiveOrOnLeave;
    const isAvailableDate = hasWorkingHours && !isPastDate;

    res.json({
      success: true,
      date: dateStr,
      providerId,
      providerType: providerType || provider.role,
      providerName: provider.full_name,
      appointmentDuration: 30,
      hasWorkingHours,
      isAvailableDate,
      slots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new appointment with atomic availability validation and interval overlap check
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

    if (!patientId || !treatment || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Patient, treatment, date, and time are required.' });
    }

    // --- 1. Atomic Double-Booking & Interval Overlap Check ---
    const staffId = doctorId || therapistId;
    
    if (staffId) {
      const dateStr = getLocalDateStr(appointment_date);
      const reqStartMins = parseTimeToMinutes(appointment_time);
      const reqDuration = treatment === 'Consultation' ? 30 : 60;
      const reqEndMins = reqStartMins + reqDuration;

      // A. Check interval overlap with existing active appointments for staff member
      const staffAppointments = await Appointment.find({
        $or: [{ doctorId: staffId }, { therapistId: staffId }],
        status: { $ne: 'cancelled' }
      });

      const existingAppointments = staffAppointments.filter(appt => {
        return getLocalDateStr(appt.appointment_date) === dateStr;
      });

      const hasConflict = existingAppointments.some(appt => {
        const apptStartMins = parseTimeToMinutes(appt.appointment_time);
        const apptDuration = appt.treatment === 'Consultation' ? 30 : 60;
        const apptEndMins = apptStartMins + apptDuration;
        return apptStartMins === reqStartMins || isOverlapping(apptStartMins, apptEndMins, reqStartMins, reqEndMins);
      });

      if (hasConflict) {
        return res.status(409).json({ 
          message: 'This time slot is already booked for the selected doctor/therapist. Please select another time slot.' 
        });
      }

      // B. Check if staff member blocked this slot interval in their profile
      const staffMember = await User.findById(staffId);
      if (staffMember && staffMember.blockedSlots) {
        const isBlocked = staffMember.blockedSlots.some(slot => {
          const slotDateStr = getLocalDateStr(slot.date);
          if (slotDateStr !== dateStr) return false;
          const blockedStartMins = parseTimeToMinutes(slot.time);
          const blockedEndMins = blockedStartMins + 30;
          return isOverlapping(blockedStartMins, blockedEndMins, reqStartMins, reqEndMins);
        });

        if (isBlocked) {
          return res.status(409).json({ 
            message: 'The provider is not available at this time. Please choose another slot.' 
          });
        }
      }
    }

    // --- 2. Cost / Pricing Logic ---
    const treatmentCosts = {
      'Consultation': 500,     
      'Abhyanga': 2000,        
      'Shirodhara': 2500,      
      'Swedana': 1500,         
      'Pizhichil': 3000        
    };

    let finalCost = treatmentCosts[treatment] || 1500;

    const appointment = new Appointment({
      patientId,
      therapistId,
      doctorId,
      treatment,
      appointment_date,
      appointment_time,
      cost: finalCost
    });

    const createdAppointment = await appointment.save();
    
    // Return fully populated appointment object
    const populated = await Appointment.findById(createdAppointment._id)
      .populate('patientId', 'full_name email phone')
      .populate('doctorId', 'full_name designation')
      .populate('therapistId', 'full_name designation');

    res.status(201).json(populated);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all appointments with server-side categorization
// @route   GET /api/appointments
const getAppointments = async (req, res) => {
  try {
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
      .populate('patientId', 'full_name email phone') 
      .populate('therapistId', 'full_name designation')
      .populate('doctorId', 'full_name designation')
      .sort({ appointment_date: -1 });

    const todayStr = getTodayDateStr();

    // Server-side classification mapping
    const categorizedAppts = appointments.map(appt => {
      const obj = appt.toObject();
      const dateStr = getLocalDateStr(appt.appointment_date);
      
      let category = 'PAST';
      if (dateStr === todayStr) {
        category = 'TODAY';
      } else if (dateStr > todayStr) {
        category = 'UPCOMING';
      }
      obj.category = category;
      return obj;
    });

    // Optional category query parameter filter
    if (req.query.category) {
      const catQuery = req.query.category.toLowerCase();
      if (catQuery === 'today') {
        const todayAppts = categorizedAppts
          .filter(a => a.category === 'TODAY' && a.status !== 'cancelled')
          .sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''));
        return res.json(todayAppts);
      }
      if (catQuery === 'upcoming') {
        const upcomingAppts = categorizedAppts
          .filter(a => a.category === 'UPCOMING' && a.status !== 'cancelled')
          .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
        return res.json(upcomingAppts);
      }
      if (catQuery === 'past') {
        const pastAppts = categorizedAppts.filter(a => a.category === 'PAST');
        return res.json(pastAppts);
      }
    }

    res.json(categorizedAppts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'full_name email phone') 
      .populate('therapistId', 'full_name designation') 
      .populate('doctorId', 'full_name designation'); 

    if (appointment) {
      const obj = appointment.toObject();
      const todayStr = getTodayDateStr();
      const dateStr = getLocalDateStr(appointment.appointment_date);
      obj.category = dateStr === todayStr ? 'TODAY' : dateStr > todayStr ? 'UPCOMING' : 'PAST';
      res.json(obj);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status and sync patient treatment progress on completion
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const previousStatus = appointment.status;
    appointment.status = status;
    const updatedAppointment = await appointment.save();

    // Auto-sync patient treatment progress when appointment is completed
    if (status === 'completed' && previousStatus !== 'completed' && appointment.patientId) {
      const activeRx = await Prescription.findOne({
        patientId: appointment.patientId,
        status: 'in-progress'
      });

      if (activeRx) {
        const newProgress = Math.min(activeRx.duration, (activeRx.progressCompleted || 0) + 1);
        activeRx.progressCompleted = newProgress;
        if (newProgress >= activeRx.duration) {
          activeRx.status = 'completed';
        }
        await activeRx.save();
      }
    }

    const populated = await Appointment.findById(updatedAppointment._id)
      .populate('patientId', 'full_name email phone')
      .populate('doctorId', 'full_name designation')
      .populate('therapistId', 'full_name designation');

    res.json(populated || updatedAppointment);
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
  getAvailability,
  createAppointment, 
  getAppointments, 
  getAppointmentById, 
  updateAppointmentStatus, 
  deleteAppointment,
  markAppointmentAsPaid
};