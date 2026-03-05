import { ApiResponse } from '@app-types/api.types';
import { ParkingMapResponseDTO, FloorDTO } from '@app-types/parking.types';
import { apiClient } from '@services/api/apiClient';

export const parkingService = {

  async getParkingMap(parkingCode: string): Promise<ApiResponse<ParkingMapResponseDTO>> {
    return apiClient.post('/api/ad/getListMap', { parkingCode });
  },

  async getFloor(parkingCode: string, floorLevel: number): Promise<ApiResponse<FloorDTO>> {
    return apiClient.get(`/api/us/getParkingMap/${parkingCode}/floors/${floorLevel}`);
  },

  async getSlotStatus(slotCode: string): Promise<ApiResponse<{ status: number; statusName: string }>> {
    return apiClient.get(`/slots/${slotCode}/status`);
  },
};
