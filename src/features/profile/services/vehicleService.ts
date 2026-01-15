import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { Vehicle } from '../../../types/vehicle.types';
import { ApiResponse } from '../../../types/api.types';


export const vehicleService = {
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.get(ENDPOINTS.GET_VEHICLES);
  },

  async createVehicle(data: Omit<Vehicle, 'id' | 'userId'>): Promise<ApiResponse<Vehicle>> {
    return apiClient.post(ENDPOINTS.CREATE_VEHICLE, data);
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    return apiClient.put(ENDPOINTS.UPDATE_VEHICLE(id), data);
  },

  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(ENDPOINTS.DELETE_VEHICLE(id));
  },

  async setDefaultVehicle(id: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.post(ENDPOINTS.SET_DEFAULT_VEHICLE(id));
  },
};
