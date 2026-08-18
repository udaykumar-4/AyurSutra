const Appointment = require('../../models/appointment');
const User = require('../../models/user');

// Helper to convert time string (e.g. "10:00 AM", "14:30", "10:00") into minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 600; // Default 10:00 AM (600 mins)

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

// Helper to format minutes from midnight into 12-hour format string (e.g. 600 -> "10:00 AM")
const formatMinutesToTime = (totalMins) => {
  const hours24 = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${minsStr} ${period}`;
};

class SmartSchedulingService {
  /**
   * Check if a specific staff member has a conflict at a given date/time
   */
  async checkConflict(staffId, dateStr, timeStr, durationMins = 60) {
    if (!staffId || !dateStr || !timeStr) {
      return { hasConflict: true, reason: 'Missing staff, date, or time parameter' };
    }

    const reqStartMins = parseTimeToMinutes(timeStr);
    const reqEndMins = reqStartMins + durationMins;

    // Working hours guard (08:00 AM - 06:00 PM -> 480 - 1080 mins)
    if (reqStartMins < 480 || reqEndMins > 1080) {
      return { hasConflict: true, reason: 'Requested time is outside clinic working hours (08:00 AM - 06:00 PM)' };
    }

    // Date range bounds (UTC midnight to end of day)
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    // 1. Check existing appointments for staff member
    const existingAppts = await Appointment.find({
      $or: [
        { doctorId: staffId },
        { therapistId: staffId }
      ],
      appointment_date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    for (const appt of existingAppts) {
      const apptStartMins = parseTimeToMinutes(appt.appointment_time);
      const apptEndMins = apptStartMins + 60; // Standard 60 min session

      // Overlap condition: (StartA < EndB) AND (EndA > StartB)
      if (reqStartMins < apptEndMins && reqEndMins > apptStartMins) {
        return {
          hasConflict: true,
          reason: `Conflict with existing appointment for ${appt.treatment} at ${appt.appointment_time}`
        };
      }
    }

    // 2. Check staff blockedSlots
    const staffUser = await User.findById(staffId);
    if (staffUser && staffUser.blockedSlots && staffUser.blockedSlots.length > 0) {
      for (const slot of staffUser.blockedSlots) {
        const slotDate = new Date(slot.date).toISOString().split('T')[0];
        const reqDateStr = new Date(dateStr).toISOString().split('T')[0];

        if (slotDate === reqDateStr) {
          const blockedMins = parseTimeToMinutes(slot.time);
          if (reqStartMins < blockedMins + 60 && reqEndMins > blockedMins) {
            return {
              hasConflict: true,
              reason: `Staff member has blocked out time slot at ${slot.time}`
            };
          }
        }
      }
    }

    return { hasConflict: false };
  }

  /**
   * Generate ranked alternative slot recommendations for a staff member
   */
  async getRecommendations(staffId, preferredDateStr, preferredTimeStr = '10:00 AM', durationMins = 60) {
    const prefMins = parseTimeToMinutes(preferredTimeStr);

    // Generate candidate slot grid from 08:00 AM (480) to 05:00 PM (1020) every 30 mins
    const candidateTimes = [];
    for (let mins = 480; mins <= 1020; mins += 30) {
      candidateTimes.push(mins);
    }

    // Fetch staff existing appointments on that date to compute compact schedule bonus
    const targetDate = new Date(preferredDateStr);
    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    const existingAppts = await Appointment.find({
      $or: [{ doctorId: staffId }, { therapistId: staffId }],
      appointment_date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    const existingMins = existingAppts.map(a => parseTimeToMinutes(a.appointment_time));

    const recommendedSlots = [];
    let isPreferredAvailable = false;

    for (const candMins of candidateTimes) {
      const candTimeFormatted = formatMinutesToTime(candMins);
      const conflictCheck = await this.checkConflict(staffId, preferredDateStr, candTimeFormatted, durationMins);

      if (!conflictCheck.hasConflict) {
        if (candMins === prefMins) {
          isPreferredAvailable = true;
        }

        // Deterministic Scoring Formula
        // Base = 100 - 5 * |candMins - prefMins| / 15
        const deviationSteps = Math.abs(candMins - prefMins) / 15;
        let score = Math.max(10, Math.round(100 - (5 * deviationSteps)));

        // Compact Schedule Bonus (+20 if directly adjacent to an existing appointment)
        const isAdjacent = existingMins.some(m => Math.abs(m - candMins) === 60);
        if (isAdjacent) {
          score += 20;
        }

        // Rationale explanation
        let rationale = 'Available slot';
        if (candMins === prefMins) {
          rationale = 'Exact match for requested time';
        } else if (isAdjacent) {
          rationale = `Optimal schedule gap (${Math.abs(candMins - prefMins)} mins from preferred)`;
        } else {
          rationale = `${Math.abs(candMins - prefMins)} mins from requested time`;
        }

        recommendedSlots.push({
          time: candTimeFormatted,
          score,
          rationale
        });
      }
    }

    // Sort recommended slots by score descending
    recommendedSlots.sort((a, b) => b.score - a.score);

    return {
      requestedSlotAvailable: isPreferredAvailable,
      recommendedSlots: recommendedSlots.slice(0, 5) // Return top 5 recommendations
    };
  }
}

module.exports = new SmartSchedulingService();
