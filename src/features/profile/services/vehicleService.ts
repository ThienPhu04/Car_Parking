import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { Vehicle } from '../../../types/vehicle.types';
import { ApiResponse } from '../../../types/api.types';


export const vehicleService = {
  async getVehicles(payload?: any): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.post(ENDPOINTS.GET_VEHICLES, payload || {});
  },

  async getVehicleDetail(payload: any): Promise<ApiResponse<Vehicle>> {
    return apiClient.post(ENDPOINTS.GET_VEHICLE_DETAIL, payload);
  },

  async createVehicle(data: Omit<Vehicle, 'id' | 'userId'>): Promise<ApiResponse<Vehicle>> {
    return apiClient.post(ENDPOINTS.CREATE_VEHICLE, data);
  },

  async updateVehicle(id: string, data: any): Promise<ApiResponse<Vehicle>> {
    // Backend updateVehicles API expects "code" identifier inside the payload
    return apiClient.post(ENDPOINTS.UPDATE_VEHICLE, { code: id, ...data });
  },

  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    // Backend deleteVehilces API expects { items: [{ code: "..." }] }
    return apiClient.delete(ENDPOINTS.DELETE_VEHICLE, { data: { items: [{ code: id }] } });
  },

  async setDefaultVehicle(id: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.post(ENDPOINTS.SET_DEFAULT_VEHICLE(id));
  },
};
