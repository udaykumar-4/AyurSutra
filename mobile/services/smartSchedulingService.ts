import apiClient from '../api/client';

export interface RecommendedSlot {
  time: string;
  score: number;
  rationale: string;
}

export interface RecommendationResponse {
  requestedSlotAvailable: boolean;
  recommendedSlots: RecommendedSlot[];
}

export interface ConflictCheckResponse {
  hasConflict: boolean;
  reason?: string;
}

export const smartSchedulingService = {
  /**
   * Check if a staff member has a conflict at a specific date and time
   */
  checkConflicts: async (
    staffId: string,
    date: string,
    time: string,
    durationMins?: number
  ): Promise<ConflictCheckResponse> => {
    const response = await apiClient.post<ConflictCheckResponse>('/scheduling/check-conflicts', {
      staffId,
      date,
      time,
      durationMins: durationMins || 60,
    });
    return response.data;
  },

  /**
   * Fetch ranked alternative slot recommendations
   */
  getRecommendations: async (
    staffId: string,
    preferredDate: string,
    preferredTime?: string,
    durationMins?: number
  ): Promise<RecommendationResponse> => {
    const response = await apiClient.post<RecommendationResponse>('/scheduling/recommendations', {
      staffId,
      preferredDate,
      preferredTime: preferredTime || '10:00 AM',
      durationMins: durationMins || 60,
    });
    return response.data;
  },
};

export default smartSchedulingService;
