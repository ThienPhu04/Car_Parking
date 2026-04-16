import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import {
  Booking,
  CreateBookingRequest,
  GetBookingsRequest,
} from '../../../types/booking.types';
import { ApiResponse } from '../../../types/api.types';

type CreateBookingPayload = {
  userId: string;
  vehiclesId: string;
  expectedArrivalTime: string;
  status?: number;
};

type CancelBookingPayload = {
  bookingCode: string;
  userCode: string;
};

export const bookingService = {
  async getBookings(payload: GetBookingsRequest): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.GET_BOOKINGS, payload);
  },

  async createBooking(data: CreateBookingPayload | CreateBookingRequest): Promise<ApiResponse<any>> {
    return apiClient.post(ENDPOINTS.CREATE_BOOKING, data);
  },

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return apiClient.get(ENDPOINTS.GET_BOOKING(id));
  },

  async cancelBooking(payload: CancelBookingPayload): Promise<ApiResponse<Booking>> {
    return apiClient.post(ENDPOINTS.CANCEL_BOOKING, payload);
  },

  async getActiveBooking(): Promise<ApiResponse<Booking | null>> {
    return apiClient.get(ENDPOINTS.GET_ACTIVE_BOOKING);
  },
};
