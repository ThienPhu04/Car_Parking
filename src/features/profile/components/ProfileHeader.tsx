import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { User } from '../../../types/auth.types';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

interface ProfileHeaderProps {
  user: User;
  onEditPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onEditPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="person" size={48} color={COLORS.primary} />
          </View>
        )}
        <TouchableOpacity style={styles.editAvatarButton}>
          <Icon name="camera" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          {onEditPress && (
            <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
              <Icon name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.contactInfo}>
          {user.email && (
            <View style={styles.contactItem}>
              <Icon name="mail-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.contactText}>{user.email}</Text>
            </View>
          )}
          {user.phone && (
            <View style={styles.contactItem}>
              <Icon name="call-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.contactText}>{user.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.memberBadge}>
          <Icon name="star" size={16} color={COLORS.warning} />
          <Text style={styles.memberText}>Thành viên Vàng</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.backgroundSecondary,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  editButton: {
    padding: SPACING.xs,
  },
  contactInfo: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  memberText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.warning,
  },
});