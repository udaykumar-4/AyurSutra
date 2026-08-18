import apiClient from '../api/client';
import { User, UserRole, AuthResponse } from '../types/user';

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<AuthResponse> => {
    const response = await apiClient.put<AuthResponse>('/users/profile', data);
    return response.data;
  },

  blockSlot: async (slot: { date: string; time: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/users/profile/block-slot', slot);
    return response.data;
  },

  unblockSlot: async (slotId: string): Promise<AuthResponse> => {
    const response = await apiClient.delete<AuthResponse>(`/users/profile/unblock-slot/${slotId}`);
    return response.data;
  },

  getAllUsers: async (role?: UserRole): Promise<User[]> => {
    const url = role ? `/users?role=${role}` : '/users';
    const response = await apiClient.get<User[]>(url);
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUserAdmin: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}/status`, { isActive, status: isActive ? 'active' : 'inactive' });
    return response.data;
  },

  deleteUserAdmin: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },
};

export default userService;
