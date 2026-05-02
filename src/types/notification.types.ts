export enum NotificationType {
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_EXPIRED = 'booking_expired',
  SLOT_AVAILABLE = 'slot_available',
  PARKING_FULL = 'parking_full',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationDto {
  _id?: string;
  id?: string;
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
