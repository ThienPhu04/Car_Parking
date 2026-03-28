import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import {
  Booking,
  GetBookingsRequest,
} from '../../../types/booking.types';
import { ApiResponse } from '../../../types/api.types';


export const bookingService = {
  async getBookings(payload: GetBookingsRequest): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.GET_BOOKINGS, payload);
  },

  async createBooking(data: Record<string, any>): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.CREATE_BOOKING, data);
  },

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return apiClient.get(ENDPOINTS.GET_BOOKING(id));
  },

  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    return apiClient.delete(ENDPOINTS.CANCEL_BOOKING(id));
  },

  async getActiveBooking(): Promise<ApiResponse<Booking | null>> {
    return apiClient.get(ENDPOINTS.GET_ACTIVE_BOOKING);
  },
};
