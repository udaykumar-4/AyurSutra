const Appointment = require('../../models/appointment');
const Prescription = require('../../models/prescription');
const Feedback = require('../../models/feedback');
const User = require('../../models/user');

class OutcomeAnalyticsService {
  /**
   * Global Clinic-Wide Analytics (Admin)
   */
  async getGlobalOutcomes() {
    // 1. Operational Metrics
    const allAppointments = await Appointment.find({});
    const totalAppointments = allAppointments.length;
    const completedAppointments = allAppointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = allAppointments.filter(a => a.status === 'cancelled').length;
    const inProgressAppointments = allAppointments.filter(a => a.status === 'in-progress').length;
    const scheduledAppointments = allAppointments.filter(a => a.status === 'scheduled').length;

    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
    const cancellationRate = totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0;

    let totalRevenueCollected = 0;
    let pendingReceivables = 0;
    allAppointments.forEach(a => {
      const cost = a.cost || 0;
      if (a.isPaid) {
        totalRevenueCollected += cost;
      } else {
        pendingReceivables += cost;
      }
    });

    // 2. Treatment Adherence / Progress Metrics
    const allPrescriptions = await Prescription.find({});
    const totalPrescriptions = allPrescriptions.length;
    const completedPrescriptions = allPrescriptions.filter(p => p.status === 'completed').length;
    const activePrescriptions = allPrescriptions.filter(p => p.status === 'in-progress').length;

    let totalPrescribedSessions = 0;
    let totalCompletedSessions = 0;
    allPrescriptions.forEach(p => {
      totalPrescribedSessions += (p.duration || 0);
      totalCompletedSessions += (p.progressCompleted || 0);
    });

    const adherenceRate = totalPrescribedSessions > 0
      ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
      : 0;

    // 3. Patient-Reported Outcomes
    const allFeedback = await Feedback.find({});
    const totalFeedbackCount = allFeedback.length;

    let sumDoctorRating = 0, countDoctor = 0;
    let sumTherapistRating = 0, countTherapist = 0;
    let sumOverallRating = 0, countOverall = 0;

    allFeedback.forEach(f => {
      if (f.doctorRating) { sumDoctorRating += f.doctorRating; countDoctor++; }
      if (f.therapistRating) { sumTherapistRating += f.therapistRating; countTherapist++; }
      if (f.overallRating) { sumOverallRating += f.overallRating; countOverall++; }
    });

    const avgDoctorRating = countDoctor > 0 ? Number((sumDoctorRating / countDoctor).toFixed(1)) : 0;
    const avgTherapistRating = countTherapist > 0 ? Number((sumTherapistRating / countTherapist).toFixed(1)) : 0;
    const avgOverallRating = countOverall > 0 ? Number((sumOverallRating / countOverall).toFixed(1)) : 0;

    // 4. Clinical Outcomes Summary (Aggregate User Vitals Count)
    const patientUsers = await User.find({ role: 'patient' });
    const patientsWithVitals = patientUsers.filter(u => u.bloodPressure || u.weight || u.heartRate).length;

    return {
      operational: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        inProgressAppointments,
        scheduledAppointments,
        completionRate,
        cancellationRate,
        totalRevenueCollected,
        pendingReceivables
      },
      adherence: {
        totalPrescriptions,
        completedPrescriptions,
        activePrescriptions,
        totalPrescribedSessions,
        totalCompletedSessions,
        adherenceRate
      },
      patientReported: {
        totalFeedbackCount,
        avgDoctorRating,
        avgTherapistRating,
        avgOverallRating
      },
      clinical: {
        totalPatientCount: patientUsers.length,
        patientsWithVitalsRecorded: patientsWithVitals,
        hasReliableVitals: patientsWithVitals > 0
      }
    };
  }

  /**
   * Doctor Assigned Patient Analytics
   */
  async getDoctorOutcomes(doctorId) {
    const appointments = await Appointment.find({ doctorId });
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    const prescriptions = await Prescription.find({ doctorId });
    const totalPrescriptions = prescriptions.length;
    const completedPrescriptions = prescriptions.filter(p => p.status === 'completed').length;

    let totalPrescribedSessions = 0;
    let totalCompletedSessions = 0;
    prescriptions.forEach(p => {
      totalPrescribedSessions += (p.duration || 0);
      totalCompletedSessions += (p.progressCompleted || 0);
    });
    const adherenceRate = totalPrescribedSessions > 0
      ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
      : 0;

    const feedback = await Feedback.find({ doctorId });
    let sumDoctorRating = 0;
    feedback.forEach(f => { sumDoctorRating += (f.doctorRating || 0); });
    const avgDoctorRating = feedback.length > 0 ? Number((sumDoctorRating / feedback.length).toFixed(1)) : 0;

    return {
      operational: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        completionRate
      },
      adherence: {
        totalPrescriptions,
        completedPrescriptions,
        totalPrescribedSessions,
        totalCompletedSessions,
        adherenceRate
      },
      patientReported: {
        totalFeedbackCount: feedback.length,
        avgDoctorRating
      }
    };
  }

  /**
   * Therapist Assigned Patient Analytics
   */
  async getTherapistOutcomes(therapistId) {
    const prescriptions = await Prescription.find({ therapistId });
    const totalPrescriptions = prescriptions.length;
    const completedPrescriptions = prescriptions.filter(p => p.status === 'completed').length;

    let totalPrescribedSessions = 0;
    let totalCompletedSessions = 0;
    prescriptions.forEach(p => {
      totalPrescribedSessions += (p.duration || 0);
      totalCompletedSessions += (p.progressCompleted || 0);
    });
    const adherenceRate = totalPrescribedSessions > 0
      ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
      : 0;

    const feedback = await Feedback.find({ therapistId });
    let sumTherapistRating = 0;
    feedback.forEach(f => { sumTherapistRating += (f.therapistRating || 0); });
    const avgTherapistRating = feedback.length > 0 ? Number((sumTherapistRating / feedback.length).toFixed(1)) : 0;

    return {
      adherence: {
        totalPrescriptions,
        completedPrescriptions,
        totalPrescribedSessions,
        totalCompletedSessions,
        adherenceRate
      },
      patientReported: {
        totalFeedbackCount: feedback.length,
        avgTherapistRating
      }
    };
  }

  /**
   * Patient Self Analytics (Strictly Scoped)
   */
  async getPatientOutcomes(patientId) {
    const patientUser = await User.findById(patientId).select('-password');
    if (!patientUser) {
      throw new Error('Patient record not found');
    }

    const appointments = await Appointment.find({ patientId });
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

    const prescriptions = await Prescription.find({ patientId });
    let totalPrescribedSessions = 0;
    let totalCompletedSessions = 0;
    prescriptions.forEach(p => {
      totalPrescribedSessions += (p.duration || 0);
      totalCompletedSessions += (p.progressCompleted || 0);
    });
    const adherenceRate = totalPrescribedSessions > 0
      ? Math.round((totalCompletedSessions / totalPrescribedSessions) * 100)
      : 0;

    const feedback = await Feedback.find({ patientId });

    const hasVitals = !!(patientUser.bloodPressure || patientUser.heartRate || patientUser.weight || patientUser.temperature);

    return {
      patient: {
        _id: patientUser._id,
        full_name: patientUser.full_name,
        condition: patientUser.condition
      },
      operational: {
        totalAppointments,
        completedAppointments
      },
      adherence: {
        totalPrescriptions: prescriptions.length,
        totalPrescribedSessions,
        totalCompletedSessions,
        adherenceRate
      },
      patientReported: {
        feedbackSubmitted: feedback.length
      },
      clinical: {
        hasVitalsData: hasVitals,
        vitals: hasVitals ? {
          bloodPressure: patientUser.bloodPressure,
          heartRate: patientUser.heartRate,
          weight: patientUser.weight,
          temperature: patientUser.temperature
        } : null
      }
    };
  }
}

module.exports = new OutcomeAnalyticsService();
