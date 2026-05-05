import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { ApiResponse } from '../../../types/api.types';
import {
  ParkingSession,
  ParkingSessionProcessPayload,
  ParkingSessionProcessResult,
} from '../../../types/parkingSession.types';
import { normalizeParkingSession } from '../utils/parkingSessionAdapters';

export type GetParkingSessionsPayload = {
  userCode: string;
  plateNumber?: string;
  status?: number;
  fromDate?: string;
  toDate?: string;
};

type ParkingSessionProcessApiData = {
  session?: unknown;
  qr?: string;
  content?: string;
  amount?: number;
};

type ParkingSessionProcessApiResponse = {
  type?: string;
  message?: string;
  data?: unknown;
};

const normalizeProcessResult = (
  payload?: ParkingSessionProcessApiResponse,
): ParkingSessionProcessResult => {
  const normalizedType = payload?.type;
  const rawData = payload?.data as ParkingSessionProcessApiData | undefined;
  const sessionSource =
    rawData?.session && typeof rawData.session === 'object'
      ? rawData.session
      : rawData && typeof rawData === 'object' && ('_id' in rawData || 'code' in rawData)
        ? rawData
        : undefined;

  return {
    type:
      normalizedType === 'CHECKIN'
      || normalizedType === 'SUCCESS'
      || normalizedType === 'QR_REQUIRED'
      || normalizedType === 'ALREADY_PAID'
        ? normalizedType
        : 'CHECKIN',
    message: payload?.message,
    session: sessionSource ? normalizeParkingSession(sessionSource) : undefined,
    paymentQr:
      rawData?.qr || rawData?.content || rawData?.amount
        ? {
            qr: rawData?.qr,
            content: rawData?.content,
            amount: Number(rawData?.amount || 0) || undefined,
          }
        : undefined,
  };
};

export const parkingSessionService = {
  async getParkingSessions(
    payload: GetParkingSessionsPayload,
  ): Promise<ApiResponse<ParkingSession[]>> {
    return apiClient.post(ENDPOINTS.GET_PARKING_SESSIONS, payload);
  },

  async handleParkingSession(
    payload: ParkingSessionProcessPayload,
  ): Promise<ApiResponse<ParkingSessionProcessResult>> {
    const response = await apiClient.post<ParkingSessionProcessApiResponse>(
      ENDPOINTS.HANDLE_PARKING_SESSION,
      {
        plateNumber: payload.plateNumber,
        capturedAt: payload.capturedAt,
        _id: payload.licensePlateId,
      },
    );

    return {
      ...response,
      data: normalizeProcessResult(response.data),
    };
  },
};
