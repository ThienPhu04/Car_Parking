import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

interface Step {
  id: string;
  instruction: string;
  distance?: string;
  icon: string;
}

interface DirectionStepsProps {
  steps: Step[];
  estimatedTime?: string;
  totalDistance?: string;
}

export const DirectionSteps: React.FC<DirectionStepsProps> = ({
  steps,
  estimatedTime,
  totalDistance,
}) => {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hướng dẫn đi</Text>
        {estimatedTime && (
          <View style={styles.timeContainer}>
            <Icon name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{estimatedTime}</Text>
          </View>
        )}
      </View>

      {totalDistance && (
        <Text style={styles.distance}>Khoảng cách: {totalDistance}</Text>
      )}

      <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <View style={styles.stepIcon}>
                <Icon name={step.icon} size={20} color={COLORS.primary} />
              </View>
              {index < steps.length - 1 && <View style={styles.stepLine} />}
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepNumber}>Bước {index + 1}</Text>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
              {step.distance && (
                <Text style={styles.stepDistance}>{step.distance}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: SPACING.md,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  distance: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  stepsContainer: {
    maxHeight: 200,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stepInstruction: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  stepDistance: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});