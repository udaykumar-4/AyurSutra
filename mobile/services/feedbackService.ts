import apiClient from '../api/client';
import { Feedback, CreateFeedbackPayload } from '../types/feedback';

export const feedbackService = {
  submitFeedback: async (payload: CreateFeedbackPayload): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>('/feedback', payload);
    return response.data;
  },

  getDoctorFeedback: async (): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>('/feedback/doctor');
    return response.data;
  },

  getTherapistFeedback: async (): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>('/feedback/therapist');
    return response.data;
  },
};

export default feedbackService;
