import apiClient from '../api/client';
import { Appointment, CreateAppointmentPayload, AppointmentStatus } from '../types/appointment';

export const appointmentService = {
  getAppointments: async (filters?: { patientId?: string; doctorId?: string; therapistId?: string }): Promise<Appointment[]> => {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.patientId) params.append('patientId', filters.patientId);
      if (filters.doctorId) params.append('doctorId', filters.doctorId);
      if (filters.therapistId) params.append('therapistId', filters.therapistId);
      const str = params.toString();
      if (str) query = `?${str}`;
    }
    const response = await apiClient.get<Appointment[]>(`/appointments${query}`);
    return response.data;
  },

  createAppointment: async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/appointments', payload);
    return response.data;
  },

  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    const response = await apiClient.put<Appointment>(`/appointments/${id}/status`, { status });
    return response.data;
  },

  markAsPaid: async (id: string): Promise<Appointment> => {
    const response = await apiClient.put<Appointment>(`/appointments/${id}/pay`);
    return response.data;
  },

  updatePaymentStatus: async (id: string, isPaid: boolean): Promise<Appointment> => {
    const response = await apiClient.put<Appointment>(`/appointments/${id}/pay`, { isPaid });
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/appointments/${id}`);
    return response.data;
  },
};

export default appointmentService;
