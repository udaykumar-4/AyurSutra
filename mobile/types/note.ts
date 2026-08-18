export interface AuthorSummary {
  _id: string;
  full_name: string;
  role: string;
}

export interface Note {
  _id: string;
  patientId: string;
  authorId: AuthorSummary | string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotePayload {
  patientId: string;
  note: string;
}
