import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView }                      from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon                                  from 'react-native-vector-icons/Ionicons';

import { Card }       from '../../../shared/components/Card';
import { COLORS }     from '../../../shared/constants/colors';
import { SPACING }    from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { Floor }      from '../../../types/parking.types';

// ─── NAVIGATION PARAMS ───────────────────────────────────────────────────────

type FloorSelectionParams = {
  FloorSelection: {
    floors: Floor[];
    onFloorSelect: (floorLevel: number) => void;
  };
};

type FloorSelectionRoute = RouteProp<FloorSelectionParams, 'FloorSelection'>;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const FloorSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route      = useRoute<FloorSelectionRoute>();
  const { floors = [], onFloorSelect } = route.params ?? {};

  const handleSelect = (floor: Floor) => {
    onFloorSelect?.(floor.level);
    navigation.goBack();
  };

  const renderItem = ({ item }: ListRenderItemInfo<Floor>) => {
    const total     = item.totalSlots || 1;
    const occupied  = item.occupiedSlots + item.reservedSlots;
    const rate      = Math.min(occupied / total, 1);

    const barColor =
      rate > 0.8 ? COLORS.error :
      rate > 0.5 ? COLORS.warning :
                   COLORS.success;

    return (
      <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.75}>
        <Card style={styles.card}>
          {/* Floor header */}
          <View style={styles.cardHeader}>
            <View style={styles.floorIconWrap}>
              <Icon name="layers" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.floorInfo}>
              <Text style={styles.floorName}>{item.name}</Text>
              <Text style={styles.floorMeta}>
                {item.availableSlots}/{item.totalSlots} chỗ trống
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>

          {/* Occupancy bar */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${rate * 100}%`, backgroundColor: barColor }]} />
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Stat color={COLORS.success} label={`${item.availableSlots} trống`} />
            <Stat color={COLORS.error}   label={`${item.occupiedSlots} có xe`}  />
            <Stat color={COLORS.warning} label={`${item.reservedSlots} đặt`}    />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Screen header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chọn tầng</Text>
        <Text style={styles.subtitle}>Xem sơ đồ chi tiết từng tầng</Text>
      </View>

      <FlatList
        data={floors}
        keyExtractor={f => f.code}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="layers-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Không có dữ liệu tầng</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ─── STAT CHIP ───────────────────────────────────────────────────────────────

const Stat: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={statStyles.wrap}>
    <View style={[statStyles.dot, { backgroundColor: color }]} />
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding:          SPACING.lg,
    backgroundColor:  COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize:   TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color:      COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color:    COLORS.textSecondary,
  },
  list: {
    padding: SPACING.md,
  },
  card: {
    marginBottom:     SPACING.md,
    padding:          SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  floorIconWrap: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  floorInfo: {
    flex: 1,
  },
  floorName: {
    fontSize:   TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color:      COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  floorMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color:    COLORS.textSecondary,
  },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  empty: {
    alignItems: 'center',
    marginTop: SPACING.xl * 2,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color:    COLORS.textSecondary,
  },
});

const statStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color:    COLORS.textSecondary,
  },
});

export default FloorSelectionScreen;