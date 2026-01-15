import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { Notification, NotificationType } from '../../../types/notification.types';
import { useNotifications } from '../../../store/NotificationContext';
import { formatters } from '../../../shared/utils/formatters';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.BOOKING_REMINDER:
        return 'time';
      case NotificationType.BOOKING_EXPIRED:
        return 'alert-circle';
      case NotificationType.SLOT_AVAILABLE:
        return 'checkmark-circle';
      case NotificationType.PARKING_FULL:
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case NotificationType.BOOKING_REMINDER:
        return COLORS.warning;
      case NotificationType.BOOKING_EXPIRED:
        return COLORS.error;
      case NotificationType.SLOT_AVAILABLE:
        return COLORS.success;
      case NotificationType.PARKING_FULL:
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  const handlePress = async () => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async () => {
    await deleteNotification(notification.id);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card
        style={[
          styles.card,
          !notification.isRead && styles.unreadCard,
        ]}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getIconColor()}20` },
            ]}
          >
            <Icon name={getIcon()} size={24} color={getIconColor()} />
          </View>

          <View style={styles.textContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{notification.title}</Text>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message}>{notification.message}</Text>
            <Text style={styles.time}>
              {formatters.relativeTime(notification.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Icon name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  time: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
});