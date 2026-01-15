import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

interface LoadingProps {
  fullscreen?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ fullscreen = false, text }) => {
  if (fullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator color={COLORS.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  inlineContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  text: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});