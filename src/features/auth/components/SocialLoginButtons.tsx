import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

interface SocialLoginButtonsProps {
  onGooglePress?: () => void;
  onFacebookPress?: () => void;
  onApplePress?: () => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGooglePress,
  onFacebookPress,
  onApplePress,
}) => {
  const handleGoogleLogin = () => {
    if (onGooglePress) {
      onGooglePress();
    } else {
      Alert.alert('Google Login', 'Tính năng đang phát triển');
    }
  };

  const handleFacebookLogin = () => {
    if (onFacebookPress) {
      onFacebookPress();
    } else {
      Alert.alert('Facebook Login', 'Tính năng đang phát triển');
    }
  };

  const handleAppleLogin = () => {
    if (onApplePress) {
      onApplePress();
    } else {
      Alert.alert('Apple Login', 'Tính năng đang phát triển');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleLogin}
        activeOpacity={0.7}
      >
        <Icon name="logo-google" size={24} color="#EA4335" />
        <Text style={styles.buttonText}>Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.facebookButton]}
        onPress={handleFacebookLogin}
        activeOpacity={0.7}
      >
        <Icon name="logo-facebook" size={24} color="#1877F2" />
        <Text style={styles.buttonText}>Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.appleButton]}
        onPress={handleAppleLogin}
        activeOpacity={0.7}
      >
        <Icon name="logo-apple" size={24} color={COLORS.textPrimary} />
        <Text style={styles.buttonText}>Apple</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    gap: SPACING.sm,
  },
  googleButton: {
    maxWidth: 100,
  },
  facebookButton: {
    maxWidth: 100,
  },
  appleButton: {
    maxWidth: 100,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
});