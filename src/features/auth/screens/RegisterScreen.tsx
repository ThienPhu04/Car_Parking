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
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { COLORS } from '../../../shared/constants/colors';
import { validate } from '../../../shared/utils/validation';
import { authService } from '../services/authService';
import { AuthStackParamList } from '../../../types/navigation.types';
import Icon from 'react-native-vector-icons/Ionicons';
import { MESSAGES } from '../../../shared/constants/messages';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!validate.required(formData.name)) {
      newErrors.name = MESSAGES.VALIDATION.NAME_REQUIRED;
      isValid = false;
    } else if (!validate.name(formData.name)) {
      newErrors.name = 'Họ tên phải có ít nhất 2 ký tự';
      isValid = false;
    }

    if (!validate.required(formData.email)) {
      newErrors.email = MESSAGES.VALIDATION.EMAIL_REQUIRED;
      isValid = false;
    } else if (!validate.email(formData.email)) {
      newErrors.email = MESSAGES.VALIDATION.EMAIL_INVALID;
      isValid = false;
    }

    if (!validate.required(formData.phone)) {
      newErrors.phone = MESSAGES.VALIDATION.PHONE_REQUIRED;
      isValid = false;
    } else if (!validate.phone(formData.phone)) {
      newErrors.phone = MESSAGES.VALIDATION.PHONE_INVALID;
      isValid = false;
    }

    if (!validate.required(formData.password)) {
      newErrors.password = MESSAGES.VALIDATION.PASSWORD_REQUIRED;
      isValid = false;
    } else if (!validate.password(formData.password)) {
      newErrors.password = MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH;
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await authService.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      Alert.alert(
        'Đăng ký thành công',
        'Vui lòng xác thực OTP để hoàn tất đăng ký',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OTPVerification', { phone: formData.phone }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi đăng ký', error.message || MESSAGES.ERROR.UNKNOWN);
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Họ và tên"
            placeholder="Nhập họ và tên"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            leftIcon="person-outline"
            error={errors.name}
          />

          <Input
            label="Email"
            placeholder="Nhập email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            leftIcon="mail-outline"
            error={errors.email}
            autoCapitalize="none"
          />

          <Input
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            error={errors.phone}
          />

          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <Button
            title="Đăng ký"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default RegisterScreen;