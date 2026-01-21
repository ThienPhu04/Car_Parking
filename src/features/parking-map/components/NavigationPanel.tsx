import { NavigationRoute } from "@app-types/parking.types";
import { COLORS } from "@shared/constants/colors";
import { SPACING } from "@shared/constants/spacing";
import { TYPOGRAPHY } from "@shared/constants/typography";
import { useState } from "react";
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';

interface NavigationPanelProps {
  route: NavigationRoute;
  onClose: () => void;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  route,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'straight':
        return 'arrow-up';
      case 'left':
        return 'arrow-back';
      case 'right':
        return 'arrow-forward';
      default:
        return 'arrow-up';
    }
  };

  return (
    <View style={[styles.container, !isExpanded && styles.containerCollapsed]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <Icon name="navigate-circle" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Hướng dẫn đi</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerInfo}>
            {route.distance}m • {route.estimatedTime}s
          </Text>
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView
          style={styles.instructionsContainer}
          contentContainerStyle={styles.instructionsContent}
        >
          {route.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Icon
                  name={getDirectionIcon(instruction.direction)}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.instructionText}>
                {instruction.description}
              </Text>
            </View>
          ))}

          <View style={styles.destinationItem}>
            <View style={styles.destinationIcon}>
              <Icon name="flag" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.destinationText}>Đã đến chỗ đỗ xe</Text>
          </View>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Icon name="close-circle" size={20} color={COLORS.error} />
        <Text style={styles.closeText}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '50%',
  },
  containerCollapsed: {
    maxHeight: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  instructionsContainer: {
    maxHeight: 200,
  },
  instructionsContent: {
    padding: SPACING.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  instructionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  destinationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  closeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});