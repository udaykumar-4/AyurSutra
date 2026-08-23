/**
 * AyurSutra Appointment Date Categorization Utility (CommonJS Backend version)
 * Timezone-aware date parsing and categorization for Today, Upcoming, and Past appointments.
 */

const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      return cleanStr.substring(0, 10);
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const categorizeAppointmentDate = (dateInput) => {
  const apptDateStr = getLocalDateString(dateInput);
  const todayStr = getTodayDateString();

  if (!apptDateStr) return 'PAST';
  if (apptDateStr === todayStr) return 'TODAY';
  if (apptDateStr > todayStr) return 'UPCOMING';
  return 'PAST';
};

const filterTodayAppointments = (appointments, excludeCancelled = true) => {
  return appointments.filter((a) => {
    if (excludeCancelled && a.status === 'cancelled') return false;
    return categorizeAppointmentDate(a.appointment_date) === 'TODAY';
  });
};

const filterUpcomingAppointments = (appointments, excludeCancelled = true) => {
  return appointments.filter((a) => {
    if (excludeCancelled && a.status === 'cancelled') return false;
    return categorizeAppointmentDate(a.appointment_date) === 'UPCOMING';
  });
};

module.exports = {
  getLocalDateString,
  getTodayDateString,
  categorizeAppointmentDate,
  filterTodayAppointments,
  filterUpcomingAppointments
};
