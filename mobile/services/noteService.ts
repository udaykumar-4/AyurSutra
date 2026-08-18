import apiClient from '../api/client';
import { Note, CreateNotePayload } from '../types/note';

export const noteService = {
  getNotesForPatient: async (patientId: string): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>(`/notes/patient/${patientId}`);
    return response.data;
  },

  createNote: async (payload: CreateNotePayload): Promise<Note> => {
    const response = await apiClient.post<Note>('/notes', payload);
    return response.data;
  },
};

export default noteService;
