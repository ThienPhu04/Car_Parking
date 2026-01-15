import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

interface ParkingStatsProps {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
}

export const ParkingStats: React.FC<ParkingStatsProps> = ({
  totalSlots,
  availableSlots,
  occupiedSlots,
  reservedSlots,
}) => {
  const occupancyRate = totalSlots > 0 ? ((occupiedSlots + reservedSlots) / totalSlots) * 100 : 0;

  const chartData = {
    labels: ['6h', '9h', '12h', '15h', '18h', '21h'],
    datasets: [
      {
        data: [20, 45, 65, 75, 80, 55],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: COLORS.backgroundSecondary,
    backgroundGradientFrom: COLORS.backgroundSecondary,
    backgroundGradientTo: COLORS.backgroundSecondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
  };

  return (
    <View>
      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.success}20` }]}>
            <Icon name="checkmark-circle" size={28} color={COLORS.success} />
          </View>
          <Text style={styles.statValue}>{availableSlots}</Text>
          <Text style={styles.statLabel}>Chỗ trống</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.error}20` }]}>
            <Icon name="car" size={28} color={COLORS.error} />
          </View>
          <Text style={styles.statValue}>{occupiedSlots}</Text>
          <Text style={styles.statLabel}>Đã đỗ</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.warning}20` }]}>
            <Icon name="time" size={28} color={COLORS.warning} />
          </View>
          <Text style={styles.statValue}>{reservedSlots}</Text>
          <Text style={styles.statLabel}>Đã đặt</Text>
        </Card>
      </View>

      {/* Occupancy Rate */}
      <Card style={styles.rateCard}>
        <View style={styles.rateHeader}>
          <Text style={styles.rateTitle}>Tỷ lệ lấp đầy</Text>
          <Text style={styles.rateValue}>{occupancyRate.toFixed(1)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${occupancyRate}%`,
                backgroundColor:
                  occupancyRate > 80
                    ? COLORS.error
                    : occupancyRate > 50
                    ? COLORS.warning
                    : COLORS.success,
              },
            ]}
          />
        </View>
        <Text style={styles.rateSubtext}>
          {occupiedSlots + reservedSlots}/{totalSlots} chỗ đang sử dụng
        </Text>
      </Card>

      {/* Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Thống kê theo giờ</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - SPACING.md * 4}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels
          withHorizontalLabels
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  rateCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rateTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  rateValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  chartCard: {
    padding: SPACING.lg,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
});