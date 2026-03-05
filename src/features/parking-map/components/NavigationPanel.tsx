import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { NavigationRoute } from '../../../types/parking.types';
import { COLORS }          from '../../../shared/constants/colors';
import { SPACING }         from '../../../shared/constants/spacing';
import { TYPOGRAPHY }      from '../../../shared/constants/typography';

interface NavigationPanelProps {
  route: NavigationRoute;
  onClose: () => void;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({ route, onClose }) => {
  const [expanded, setExpanded] = useState(true);

  const directionIcon = (dir: string): string => {
    switch (dir) {
      case 'left':  return 'arrow-back';
      case 'right': return 'arrow-forward';
      default:      return 'arrow-up';
    }
  };

  return (
    <View style={[styles.container, !expanded && styles.collapsed]}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Icon name="navigate-circle" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Hướng dẫn đi</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerMeta}>
            {route.distance}m · {route.estimatedTime}s
          </Text>
          <Icon
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Instructions list */}
      {expanded && (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {route.instructions.map((inst, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.iconWrap}>
                <Icon name={directionIcon(inst.direction)} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>{inst.description}</Text>
            </View>
          ))}

          {/* Destination */}
          <View style={[styles.row, styles.destinationRow]}>
            <View style={[styles.iconWrap, styles.destIconWrap]}>
              <Icon name="flag" size={18} color={COLORS.success} />
            </View>
            <Text style={[styles.rowText, styles.destText]}>Đã đến chỗ đỗ xe</Text>
          </View>
        </ScrollView>
      )}

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
        <Icon name="close-circle" size={18} color={COLORS.error} />
        <Text style={styles.closeText}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 12,
  },
  collapsed: {
    maxHeight: 58,
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
    fontSize:   TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color:      COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color:    COLORS.textSecondary,
  },
  list: {
    maxHeight: 200,
  },
  listContent: {
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color:    COLORS.textPrimary,
  },
  destinationRow: {
    paddingTop:   SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  destIconWrap: {
    backgroundColor: `${COLORS.success}20`,
  },
  destText: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color:      COLORS.success,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  closeText: {
    fontSize:   TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color:      COLORS.error,
  },
});