import apiClient from '../api/client';
import { User } from '../types/user';
import { Appointment } from '../types/appointment';
import { Prescription } from '../types/prescription';
import { Note } from '../types/note';

export interface PatientReportData {
  user: User;
  appointments: Appointment[];
  prescriptions: Prescription[];
  notes: Note[];
}

export const reportService = {
  getPatientReportAdmin: async (patientId: string): Promise<PatientReportData> => {
    const response = await apiClient.get<PatientReportData>(`/reports/patient/${patientId}`);
    return response.data;
  },

  getMyReport: async (): Promise<PatientReportData> => {
    const response = await apiClient.get<PatientReportData>('/reports/my-report');
    return response.data;
  },
};

export default reportService;
