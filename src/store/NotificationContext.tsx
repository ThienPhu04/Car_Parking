import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Notification,
  NotificationDto,
  NotificationType,
} from '../types/notification.types';
import { notificationService } from '../features/notifications/services/notificationService';
import { useAuth } from './AuthContext';
import { ApiError } from '../types/api.types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const normalizeNotificationType = (type?: string): NotificationType => {
  switch (type) {
    case NotificationType.BOOKING_REMINDER:
      return NotificationType.BOOKING_REMINDER;
    case NotificationType.BOOKING_EXPIRED:
      return NotificationType.BOOKING_EXPIRED;
    case NotificationType.SLOT_AVAILABLE:
      return NotificationType.SLOT_AVAILABLE;
    case NotificationType.PARKING_FULL:
      return NotificationType.PARKING_FULL;
    default:
      return NotificationType.SYSTEM;
  }
};

const mapNotificationDto = (item: NotificationDto): Notification => ({
  id:
    item._id
    || item.id
    || `${item.title || 'notification'}-${item.createdAt || Date.now()}`,
  type: normalizeNotificationType(item.type),
  title: item.title || 'Thong bao',
  message: item.message || '',
  data: item.metadata || item.data || {},
  isRead: Boolean(item.isRead),
  createdAt: item.createdAt || item.updatedAt || new Date().toISOString(),
});

const isNotFoundError = (error: unknown) =>
  Boolean((error as ApiError | undefined)?.statusCode === 404);

const isAuthSessionError = (error: unknown) => {
  const apiError = error as ApiError | undefined;
  const message = apiError?.message?.toLowerCase() || '';

  return apiError?.statusCode === 401 || message.includes('refresh token');
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [remoteNotifications, setRemoteNotifications] = useState<
    Notification[]
  >([]);
  const [localNotifications, setLocalNotifications] = useState<
    Notification[]
  >([]);
  const [locallyReadIds, setLocallyReadIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.code || user.isGuest) {
      setRemoteNotifications([]);
      setLocalNotifications([]);
      setLocallyReadIds([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({
        userId: user.code,
      });
      const normalized = Array.isArray(response.data)
        ? response.data.map(mapNotificationDto)
        : [];
      setRemoteNotifications(normalized);
    } catch (error) {
      setRemoteNotifications([]);
      if (!isNotFoundError(error) && !isAuthSessionError(error)) {
        console.error('Error loading notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.code, user?.isGuest]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const addNotification = (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setLocalNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string) => {
    setLocallyReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setLocalNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  const markAllAsRead = async () => {
    try {
      if (user?.code && !user.isGuest) {
        await notificationService.markAllAsRead({ userId: user.code });
      }

      setLocallyReadIds((prev) => {
        const nextIds = new Set(prev);
        remoteNotifications.forEach((notif) => nextIds.add(notif.id));
        localNotifications.forEach((notif) => nextIds.add(notif.id));
        return Array.from(nextIds);
      });

      setRemoteNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setLocalNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      if (!isNotFoundError(error) && !isAuthSessionError(error)) {
        console.error('Error marking all as read:', error);
      }
    }
  };

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const notifications = useMemo(() => {
    const merged = [...localNotifications, ...remoteNotifications].map((item) =>
      locallyReadIds.includes(item.id) ? { ...item, isRead: true } : item
    );

    return merged.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, [localNotifications, locallyReadIds, remoteNotifications]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
