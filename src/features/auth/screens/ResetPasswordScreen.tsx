import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { COLORS } from '../../../shared/constants/colors';
import { MESSAGES } from '../../../shared/constants/messages';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { validate } from '../../../shared/utils/validation';
import { ResetPasswordRouteParams } from '../../../types/navigation.types';
import { authService } from '../services/authService';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<any, 'ResetPassword'>;

type ResetPasswordScreenRouteProp = RouteProp<
  { ResetPassword: ResetPasswordRouteParams },
  'ResetPassword'
>;

const extractToken = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  const tokenMatch = trimmedValue.match(/[?&]token=([^&]+)/i);

  if (tokenMatch?.[1]) {
    return decodeURIComponent(tokenMatch[1]);
  }

  return trimmedValue;
};

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { email, origin = 'auth' } = route.params;

  const [tokenInput, setTokenInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    tokenInput: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const normalizedToken = useMemo(() => extractToken(tokenInput), [tokenInput]);

  const clearFieldError = (
    field: 'tokenInput' | 'password' | 'confirmPassword',
  ) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {
      tokenInput: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!validate.required(normalizedToken)) {
      nextErrors.tokenInput = 'Vui lòng dán link hoặc token từ email.';
      isValid = false;
    }

    if (!validate.required(password)) {
      nextErrors.password = MESSAGES.VALIDATION.PASSWORD_REQUIRED;
      isValid = false;
    } else if (!validate.password(password)) {
      nextErrors.password = MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH;
      isValid = false;
    }

    if (!validate.required(confirmPassword)) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
      isValid = false;
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword({
        token: normalizedToken,
        password,
        confirmPassword,
      });

      Alert.alert(
        'Thành công',
        'Mật khẩu mới đã được cập nhật. Bạn có thể đăng nhập lại ngay bây giờ.',
        [
          {
            text: origin === 'profile' ? 'Quay lại' : 'Đăng nhập',
            onPress: () =>
              origin === 'profile'
                ? navigation.goBack()
                : navigation.navigate('Login'),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Đặt lại mật khẩu thất bại',
        error?.message || 'Link khôi phục không hợp lệ hoặc đã hết hạn.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Icon name="lock-closed-outline" size={56} color={COLORS.primary} />
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>
            {email
              ? (
                <>
                  Chúng tôi đã gửi link khôi phục tới{'\n'}
                  <Text style={styles.email}>{email}</Text>
                </>
              )
              : 'Nhập link hoặc token từ email để đặt lại mật khẩu.'}
          </Text>
        </View>

        <Input
          label="Link hoặc token"
          placeholder="Dán link khôi phục từ email"
          value={tokenInput}
          onChangeText={(value) => {
            setTokenInput(value);
            clearFieldError('tokenInput');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.tokenInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          containerStyle={styles.tokenInputContainer}
        />

        <Input
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearFieldError('password');
          }}
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            clearFieldError('confirmPassword');
          }}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Cập nhật mật khẩu"
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
          style={styles.submitButton}
        />

        {origin === 'auth' ? (
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  email: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  helperText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tokenInputContainer: {
    marginBottom: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  loginLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;
