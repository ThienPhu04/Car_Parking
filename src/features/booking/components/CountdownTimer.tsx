import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS} from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface CountdownTimerProps {
  endTime: Date;
  onTimeout: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  onTimeout,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(interval);
        onTimeout();
        setTimeLeft(0);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <View
      style={[
        styles.container,
        isWarning && styles.containerWarning,
      ]}
    >
      <Text style={styles.label}>Thời gian còn lại</Text>
      <View style={styles.timerRow}>
        <View style={styles.timerBox}>
          <Text style={[styles.timerValue, isWarning && styles.timerValueWarning]}>
            {String(minutes).padStart(2, '0')}
          </Text>
          <Text style={styles.timerUnit}>Phút</Text>
        </View>
        <Text style={[styles.separator, isWarning && styles.separatorWarning]}>:</Text>
        <View style={styles.timerBox}>
          <Text style={[styles.timerValue, isWarning && styles.timerValueWarning]}>
            {String(seconds).padStart(2, '0')}
          </Text>
          <Text style={styles.timerUnit}>Giây</Text>
        </View>
      </View>
      {isWarning && (
        <Text style={styles.warningText}>⚠️ Sắp hết thời gian giữ chỗ!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  containerWarning: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}10`,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  timerValueWarning: {
    color: COLORS.error,
  },
  timerUnit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  separator: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginHorizontal: SPACING.sm,
  },
  separatorWarning: {
    color: COLORS.error,
  },
  warningText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginTop: SPACING.md,
  },
});