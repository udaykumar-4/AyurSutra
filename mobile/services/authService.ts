import apiClient from '../api/client';
import { AuthResponse, User } from '../types/user';
import { LoginPayload, RegisterPayload } from '../types/auth';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },
};

export default authService;
