/**
 * AyurSutra Appointment Date Categorization Utility
 * Timezone-aware date parsing and categorization for Today, Upcoming, and Past appointments.
 */

/**
 * Format a date input into a clean YYYY-MM-DD local calendar date string.
 * Handles ISO strings, Date objects, and YYYY-MM-DD strings without timezone skew.
 */
export const getLocalDateString = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';

  // If dateInput is a string starting with YYYY-MM-DD
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

/**
 * Get current today's local date string in YYYY-MM-DD format.
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type AppointmentCategory = 'TODAY' | 'UPCOMING' | 'PAST';

/**
 * Categorize an appointment into 'TODAY', 'UPCOMING', or 'PAST' based on local calendar date.
 */
export const categorizeAppointmentDate = (dateInput?: string | Date | null): AppointmentCategory => {
  const apptDateStr = getLocalDateString(dateInput);
  const todayStr = getTodayDateString();

  if (!apptDateStr) return 'PAST';
  if (apptDateStr === todayStr) return 'TODAY';
  if (apptDateStr > todayStr) return 'UPCOMING';
  return 'PAST';
};

/**
 * Filter list of appointments for 'TODAY' (excluding cancelled if requested)
 */
export const filterTodayAppointments = <T extends { appointment_date: string | Date; status?: string }>(
  appointments: T[],
  excludeCancelled: boolean = true
): T[] => {
  return appointments.filter((a) => {
    if (excludeCancelled && a.status === 'cancelled') return false;
    return categorizeAppointmentDate(a.appointment_date) === 'TODAY';
  });
};

/**
 * Filter list of appointments for 'UPCOMING' (excluding cancelled if requested)
 */
export const filterUpcomingAppointments = <T extends { appointment_date: string | Date; status?: string }>(
  appointments: T[],
  excludeCancelled: boolean = true
): T[] => {
  return appointments.filter((a) => {
    if (excludeCancelled && a.status === 'cancelled') return false;
    return categorizeAppointmentDate(a.appointment_date) === 'UPCOMING';
  });
};
