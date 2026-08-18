export type UserRole = 'admin' | 'doctor' | 'therapist' | 'patient' | 'receptionist';

export interface BlockedSlot {
  _id?: string;
  date: string;
  time: string;
}

export interface User {
  _id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  designation?: string;
  condition?: string;
  assignedDoctor?: { _id: string; full_name: string } | string;
  phone?: string;
  age?: number;
  gender?: string;
  dob?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  lastLogin?: string;
  heartRate?: string;
  bloodPressure?: string;
  weight?: string;
  temperature?: string;
  blockedSlots?: BlockedSlot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse extends User {
  token: string;
}
