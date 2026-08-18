export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'in-progress' | 'confirmed';

export interface UserSummary {
  _id: string;
  full_name: string;
}

export interface Appointment {
  _id: string;
  patientId: UserSummary | string;
  doctorId?: UserSummary | string;
  therapistId?: UserSummary | string;
  treatment: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  specialRequirements?: string;
  cost?: number;
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentPayload {
  patientId: string;
  doctorId?: string;
  therapistId?: string;
  treatment: string;
  appointment_date: string;
  appointment_time: string;
}
