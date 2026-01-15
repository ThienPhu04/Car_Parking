import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../shared/components/Card';
import { COLORS} from '../../../shared/constants/colors';
import { Floor } from '../../../types/parking.types';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

type FloorSelectionRouteProp = RouteProp<
  { FloorSelection: { onFloorSelect: (floor: number) => void } },
  'FloorSelection'
>;

const FloorSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<FloorSelectionRouteProp>();
  const { onFloorSelect } = route.params || {};

  // Mock data
  const floors: Floor[] = [
    {
      id: 1,
      name: 'Tầng 1',
      totalSlots: 30,
      availableSlots: 12,
      occupiedSlots: 15,
      reservedSlots: 3,
    },
    {
      id: 2,
      name: 'Tầng 2',
      totalSlots: 30,
      availableSlots: 8,
      occupiedSlots: 18,
      reservedSlots: 4,
    },
    {
      id: 3,
      name: 'Tầng 3',
      totalSlots: 30,
      availableSlots: 15,
      occupiedSlots: 12,
      reservedSlots: 3,
    },
    {
      id: 4,
      name: 'Tầng 4',
      totalSlots: 30,
      availableSlots: 10,
      occupiedSlots: 17,
      reservedSlots: 3,
    },
  ];

  const handleFloorSelect = (floor: Floor) => {
    if (onFloorSelect) {
      onFloorSelect(floor.id);
    }
    navigation.goBack();
  };

  const renderFloorItem = ({ item }: { item: Floor }) => {
    const occupancyRate = (item.occupiedSlots + item.reservedSlots) / item.totalSlots;

    return (
      <TouchableOpacity onPress={() => handleFloorSelect(item)}>
        <Card style={styles.floorCard}>
          <View style={styles.floorHeader}>
            <View style={styles.floorIcon}>
              <Icon name="layers" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.floorInfo}>
              <Text style={styles.floorName}>{item.name}</Text>
              <Text style={styles.floorSlots}>
                {item.availableSlots}/{item.totalSlots} chỗ trống
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${occupancyRate * 100}%`,
                  backgroundColor:
                    occupancyRate > 0.8
                      ? COLORS.error
                      : occupancyRate > 0.5
                      ? COLORS.warning
                      : COLORS.success,
                },
              ]}
            />
          </View>

          <View style={styles.floorStats}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statText}>{item.availableSlots} trống</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.statText}>{item.occupiedSlots} đã đỗ</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statText}>{item.reservedSlots} đặt trước</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chọn tầng</Text>
        <Text style={styles.subtitle}>Chọn tầng để xem sơ đồ chi tiết</Text>
      </View>

      <FlatList
        data={floors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFloorItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
  },
  floorCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  floorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  floorInfo: {
    flex: 1,
  },
  floorName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  floorSlots: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  floorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default FloorSelectionScreen;