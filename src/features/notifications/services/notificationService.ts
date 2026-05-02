import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { NotificationDto } from '../../../types/notification.types';
import { ApiError, ApiResponse } from '../../../types/api.types';

interface NotificationPayload {
  userId: string;
}

const isNotFoundError = (error: unknown) =>
  Boolean((error as ApiError | undefined)?.statusCode === 404);

const isInvalidUserPayloadError = (error: unknown) => {
  const apiError = error as ApiError | undefined;
  const message = apiError?.message?.toLowerCase() || '';

  return (
    apiError?.statusCode === 500
    && (
      message.includes('cast to string failed')
      || message.includes('path "code"')
      || message.includes("path \\\"code\\\"")
      || message.includes('model "user"')
      || message.includes("model \\\"user\\\"")
    )
  );
};

const postWithFallback = async <T>(
  endpoints: string[],
  payloadVariants: unknown[]
): Promise<ApiResponse<T>> => {
  let lastError: unknown;

  for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex += 1) {
    const endpoint = endpoints[endpointIndex];

    for (let payloadIndex = 0; payloadIndex < payloadVariants.length; payloadIndex += 1) {
      const payload = payloadVariants[payloadIndex];

      try {
        return await apiClient.post<T>(endpoint, payload);
      } catch (error) {
        lastError = error;

        const hasNextPayload = payloadIndex < payloadVariants.length - 1;
        const hasNextEndpoint = endpointIndex < endpoints.length - 1;
        const shouldTryNextPayload =
          hasNextPayload && (isNotFoundError(error) || isInvalidUserPayloadError(error));
        const shouldTryNextEndpoint =
          hasNextEndpoint && isNotFoundError(error);

        if (shouldTryNextPayload || shouldTryNextEndpoint) {
          continue;
        }

        throw error;
      }
    }
  }

  throw lastError;
};

const buildPayloadVariants = ({ userId }: NotificationPayload) => [
  { userId },
  { code: userId },
  userId,
];

const NOTIFICATION_ENDPOINTS = {
  getNotifications: [
    ENDPOINTS.GET_NOTIFICATIONS,
    '/api/us/notifications/getNotification',
    '/api/us/notification/getNotification',
  ],
  markAllAsRead: [
    ENDPOINTS.MARK_ALL_AS_READ,
    '/api/us/readAllNotification',
    '/api/us/notification/readAllNotification',
  ],
} as const;

export const notificationService = {
  getNotifications(payload: NotificationPayload) {
    return postWithFallback<NotificationDto[]>(
      [...NOTIFICATION_ENDPOINTS.getNotifications],
      buildPayloadVariants(payload)
    );
  },

  markAllAsRead(payload: NotificationPayload) {
    return postWithFallback<void>(
      [...NOTIFICATION_ENDPOINTS.markAllAsRead],
      buildPayloadVariants(payload)
    );
  },
};
