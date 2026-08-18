import { UserSummary } from './appointment';

export interface Prescription {
  _id: string;
  patientId: UserSummary | string;
  doctorId: UserSummary | string;
  therapistId: UserSummary | string;
  treatment: string;
  duration: number;
  plan?: string;
  notes?: string;
  status: 'in-progress' | 'completed';
  progressCompleted: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  doctorId: string;
  therapistId: string;
  treatment: string;
  duration: number;
  plan?: string;
  notes?: string;
}
