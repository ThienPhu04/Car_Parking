import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { Booking, CreateBookingRequest } from '../../../types/booking.types';
import { ApiResponse, PaginatedResponse } from '../../../types/api.types';


export const bookingService = {
  async getBookings(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    return apiClient.get(`${ENDPOINTS.GET_BOOKINGS}?page=${page}&pageSize=${pageSize}`);
  },

  async createBooking(data: CreateBookingRequest): Promise<ApiResponse<Booking>> {
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