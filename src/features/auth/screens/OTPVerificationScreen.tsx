import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../shared/components/Button';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { AuthStackParamList } from '../../../types/navigation.types';
import { authService } from '../services/authService';

type OTPScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const route = useRoute<OTPScreenRouteProp>();
  const { email } = route.params;

  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractToken = (value: string) => {
    const trimmedValue = value.trim();
    const tokenMatch = trimmedValue.match(/[?&]token=([^&]+)/i);

    if (tokenMatch?.[1]) {
      return decodeURIComponent(tokenMatch[1]);
    }

    return trimmedValue;
  };

  const handleVerify = async () => {
    const token = extractToken(tokenInput);

    if (!token) {
      Alert.alert('Loi', 'Vui long nhap token hoac dan link xac thuc tu email');
      return;
    }

    try {
      setIsLoading(true);
      await authService.verifyEmail(token);

      Alert.alert(
        'Thanh cong',
        'Email da duoc xac thuc. Ban co the dang nhap ngay bay gio.',
        [
          {
            text: 'Dang nhap',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Xac thuc that bai',
        error.message || 'Token xac thuc khong hop le hoac da het han'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Icon name="mail-outline" size={64} color={COLORS.primary} />
        <Text style={styles.title}>Xac thuc email</Text>
        <Text style={styles.subtitle}>
          Chung toi da gui email xac thuc toi{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <Text style={styles.helperText}>
          Mo email de lay token hoac sao chep toan bo link xac thuc roi dan vao
          o ben duoi.
        </Text>

        <TextInput
          style={styles.tokenInput}
          value={tokenInput}
          onChangeText={setTokenInput}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Nhap token hoac dan link xac thuc"
          placeholderTextColor={COLORS.textSecondary}
          multiline
          textAlignVertical="top"
        />

        <Button
          title="Xac nhan email"
          onPress={handleVerify}
          loading={isLoading}
          fullWidth
          style={styles.verifyButton}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Toi da xac thuc, quay lai dang nhap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  email: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  tokenInput: {
    width: '100%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundSecondary,
    marginBottom: SPACING.lg,
  },
  verifyButton: {
    marginBottom: SPACING.lg,
  },
  loginLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default OTPVerificationScreen;
