import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { Notification } from '../../../types/notification.types';
import { ApiResponse } from '../../../types/api.types';

export const notificationService = {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return apiClient.get(ENDPOINTS.GET_NOTIFICATIONS);
  },

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(ENDPOINTS.MARK_AS_READ(id));
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.patch(ENDPOINTS.MARK_ALL_AS_READ);
  },

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(ENDPOINTS.DELETE_NOTIFICATION(id));
  },
};