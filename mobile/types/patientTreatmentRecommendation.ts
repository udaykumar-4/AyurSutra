export interface ClassicalReference {
  source: string;
  title: string;
  text?: string;
  evidenceLevel?: string;
}

export interface PatientRecommendationOption {
  therapyName: string;
  category: string;
  objective: string;
  traditionalRationale: string;
  suggestedDuration?: string;
  suggestedSessions?: string;
  precautions?: string[];
  contraindications?: string[];
  classicalReferences?: ClassicalReference[];
  confidence: string;
  educationalOnly: boolean;
  requiresClinicianReview: boolean;
}

export interface PatientTreatmentRecommendationResponse {
  success: boolean;
  recommendationId?: string;
  isEmergency?: boolean;
  emergencyNotice?: string;
  isProhibited?: boolean;
  refusalMessage?: string;
  symptoms?: string;
  quickSelections?: string[];
  educationalWording?: string;
  recommendations?: PatientRecommendationOption[];
  safetyWarnings?: string[];
  disclaimer?: string;
  createdAt?: string;
}

export interface PatientTreatmentRecommendationRecord {
  _id: string;
  patientId: string;
  symptoms: string;
  quickSelections: string[];
  recommendations: PatientRecommendationOption[];
  safetyWarnings: string[];
  contraindications: string[];
  classicalReferences: ClassicalReference[];
  educationalOnly: boolean;
  requiresClinicianReview: boolean;
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}
