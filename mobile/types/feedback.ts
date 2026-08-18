import { UserSummary } from './appointment';

export interface Feedback {
  _id: string;
  patientId: UserSummary | string;
  doctorId?: UserSummary | string;
  doctorRating?: number;
  doctorFeedback?: string;
  therapistId?: UserSummary | string;
  therapistRating?: number;
  therapistFeedback?: string;
  overallRating: number;
  overallFeedback?: string;
  createdAt?: string;
}

export interface CreateFeedbackPayload {
  doctorRating?: number;
  doctorFeedback?: string;
  therapistRating?: number;
  therapistFeedback?: string;
  overallRating: number;
  overallFeedback?: string;
}
