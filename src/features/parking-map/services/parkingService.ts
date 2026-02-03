import { ApiResponse } from "@app-types/api.types";
import { ParkingMapDTO, FloorDTO } from "@app-types/parking.types";
import { apiClient } from "@services/api/apiClient";

export const parkingService = {

  async getParkingMap(parkingCode: string): Promise<ApiResponse<ParkingMapDTO>> {
    // Backend expects parkingCode in request body (POST)
    return apiClient.post('/api/us/getParkingMap', { parkingCode });
  },

  async getFloor(parkingCode: string, floorLevel: number): Promise<ApiResponse<FloorDTO>> {
    return apiClient.get(`/api/us/getParkingMap/${parkingCode}/floors/${floorLevel}`);
  },

  async getSlotStatus(slotCode: string): Promise<ApiResponse<{ status: number; statusName: string }>> {
    return apiClient.get(`/slots/${slotCode}/status`);
  },
};