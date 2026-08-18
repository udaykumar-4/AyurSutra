import apiClient from '../api/client';
import { Prescription, CreatePrescriptionPayload } from '../types/prescription';

export const prescriptionService = {
  createPrescription: async (payload: CreatePrescriptionPayload): Promise<Prescription> => {
    const response = await apiClient.post<Prescription>('/prescriptions', payload);
    return response.data;
  },

  updateProgress: async (id: string, progressCompleted: number): Promise<Prescription> => {
    const response = await apiClient.put<Prescription>(`/prescriptions/${id}/progress`, { progressCompleted });
    return response.data;
  },

  getByPatientId: async (patientId: string): Promise<Prescription[]> => {
    const response = await apiClient.get<Prescription[]>(`/prescriptions/patient/${patientId}`);
    return response.data;
  },

  getByDoctorId: async (doctorId: string): Promise<Prescription[]> => {
    const response = await apiClient.get<Prescription[]>(`/prescriptions/doctor/${doctorId}`);
    return response.data;
  },

  getByTherapistId: async (therapistId: string): Promise<Prescription[]> => {
    const response = await apiClient.get<Prescription[]>(`/prescriptions/therapist/${therapistId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Prescription> => {
    const response = await apiClient.get<Prescription>(`/prescriptions/${id}`);
    return response.data;
  },
};

export default prescriptionService;
