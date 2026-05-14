import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { COLORS } from '../../../shared/constants/colors';
import { validate } from '../../../shared/utils/validation';
import { useAuth } from '../../../store/AuthContext';
import { AuthStackParamList } from '../../../types/navigation.types';
import { MESSAGES } from '../../../shared/constants/messages';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { authService } from '../services/authService';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const INVALID_LOGIN_MESSAGE = 'Email hoặc mật khẩu không đúng';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, guestLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const clearLoginErrors = () => {
    setErrors({ email: '', password: '' });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    clearLoginErrors();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearLoginErrors();
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!validate.required(email)) {
      newErrors.email = MESSAGES.VALIDATION.EMAIL_REQUIRED;
      isValid = false;
    } else if (!validate.email(email)) {
      newErrors.email = MESSAGES.VALIDATION.EMAIL_INVALID;
      isValid = false;
    }

    if (!validate.required(password)) {
      newErrors.password = MESSAGES.VALIDATION.PASSWORD_REQUIRED;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    clearLoginErrors();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
    } catch (error: any) {
      const loginErrorMessage = error?.message || INVALID_LOGIN_MESSAGE;
      setErrors({
        email: loginErrorMessage,
        password: loginErrorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      await guestLogin();
    } catch (error: any) {
      Alert.alert('Lỗi đăng nhập khách', error.message || MESSAGES.ERROR.UNKNOWN);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPasswordModal = () => {
    setForgotPasswordEmail(email.trim());
    setForgotPasswordError('');
    setShowForgotPasswordModal(true);
  };

  const handleCloseForgotPasswordModal = () => {
    if (isSendingResetEmail) {
      return;
    }

    setShowForgotPasswordModal(false);
    setForgotPasswordError('');
  };

  const handleForgotPasswordEmailChange = (value: string) => {
    setForgotPasswordEmail(value);
    if (forgotPasswordError) {
      setForgotPasswordError('');
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = forgotPasswordEmail.trim();

    if (!validate.required(normalizedEmail)) {
      setForgotPasswordError(MESSAGES.VALIDATION.EMAIL_REQUIRED);
      return;
    }

    if (!validate.email(normalizedEmail)) {
      setForgotPasswordError(MESSAGES.VALIDATION.EMAIL_INVALID);
      return;
    }

    try {
      setIsSendingResetEmail(true);
      setForgotPasswordError('');
      await authService.forgotPassword(normalizedEmail);
      setShowForgotPasswordModal(false);
      Alert.alert(
        'Đã gửi email',
        'Liên kết khôi phục mật khẩu đã được gửi tới email của bạn.',
        [
          {
            text: 'Để sau',
            style: 'cancel',
          },
          {
            text: 'Nhập link',
            onPress: () =>
              navigation.navigate('ResetPassword', {
                email: normalizedEmail,
                origin: 'auth',
              }),
          },
        ],
      );
    } catch (error: any) {
      setForgotPasswordError(
        error?.message || 'Không thể gửi email khôi phục mật khẩu',
      );
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Đăng nhập</Text>

        <Text style={styles.subtitle}>
          Chào mừng đến với ứng dụng đỗ xe thông minh
        </Text>

        <Input
          label="Email"
          placeholder="Nhập email"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={handleOpenForgotPasswordModal}
        >
          <Text style={styles.forgotPasswordText}>Quên mật khẩu</Text>
        </TouchableOpacity>

        <Button
          title="Đăng nhập"
          onPress={handleLogin}
          loading={isLoading}
          fullWidth
          style={styles.loginButton}
        />

        <TouchableOpacity
          onPress={handleGuestLogin}
          disabled={isLoading}
          activeOpacity={0.7}
          style={[styles.guestButton, isLoading && styles.disabledButton]}
        >
          <Text style={styles.guestButtonText}>
            Trải nghiệm với tài khoản khách
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.registerHint}>
            Bạn chưa có tài khoản? 
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.register}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showForgotPasswordModal}
        onClose={handleCloseForgotPasswordModal}
        title="Quên mật khẩu"
      >

        <Input
          label="Email"
          placeholder="Nhập email"
          value={forgotPasswordEmail}
          onChangeText={handleForgotPasswordEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          error={forgotPasswordError}
          containerStyle={styles.modalInput}
        />

        <View style={styles.modalActions}>
          <Button
            title="Hủy"
            onPress={handleCloseForgotPasswordModal}
            variant="outline"
            style={styles.modalSecondaryButton}
            disabled={isSendingResetEmail}
          />
          <Button
            title="Gửi email"
            onPress={handleForgotPassword}
            loading={isSendingResetEmail}
            style={styles.modalPrimaryButton}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  modalInput: {
    marginBottom: SPACING.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalPrimaryButton: {
    minWidth: 120,
  },
  modalSecondaryButton: {
    minWidth: 90,
  },
  loginButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SPACING.sm,
    height: 58,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  guestButton: {
    width: '100%',
    borderRadius: SPACING.sm,
    height: 58,
    borderColor: '#df7f02',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  guestButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#df7f02',
  },
  disabledButton: {
    opacity: 0.5,
  },
  guestHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: SPACING.xl,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  register: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  registerHint: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default LoginScreen;
