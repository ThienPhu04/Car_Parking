import { ApiResponse } from '@app-types/api.types';
import { ParkingMapResponseDTO, FloorDTO } from '@app-types/parking.types';
import { apiClient } from '@services/api/apiClient';

export interface GetParkingMapParams {
  parkingCode?: string;
  status?: number | string;
  expectedArrivalTime?: string;
  expectedLeaveTime?: string;
}

export const parkingService = {

  async getParkingMap(params: GetParkingMapParams = {}): Promise<ApiResponse<ParkingMapResponseDTO>> {
    const body = {
      ...(params.parkingCode
        ? { parkingCode: params.parkingCode }
        : {}),
      ...(params.status !== undefined && params.status !== null && params.status !== ''
        ? { status: params.status }
        : {}),
      ...(params.expectedArrivalTime
        ? { expectedArrivalTime: params.expectedArrivalTime }
        : {}),
      ...(params.expectedLeaveTime
        ? { expectedLeaveTime: params.expectedLeaveTime }
        : {}),
    };

    return apiClient.post('/api/us/getParkingMap', body);
  },

  async getFloor(parkingCode: string, floorLevel: number): Promise<ApiResponse<FloorDTO>> {
    return apiClient.get(`/api/us/getParkingMap/${parkingCode}/floors/${floorLevel}`);
  },

  async getSlotStatus(slotCode: string): Promise<ApiResponse<{ status: number; statusName: string }>> {
    return apiClient.get(`/slots/${slotCode}/status`);
  },
};
