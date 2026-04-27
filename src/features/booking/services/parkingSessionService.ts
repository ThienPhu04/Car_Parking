import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { ApiResponse } from '../../../types/api.types';
import { ParkingSession } from '../../../types/parkingSession.types';

export type GetParkingSessionsPayload = {
  userCode: string;
  plateNumber?: string;
  status?: number;
  fromDate?: string;
  toDate?: string;
};

export const parkingSessionService = {
  async getParkingSessions(
    payload: GetParkingSessionsPayload,
  ): Promise<ApiResponse<ParkingSession[]>> {
    return apiClient.post(ENDPOINTS.GET_PARKING_SESSIONS, payload);
  },
};
