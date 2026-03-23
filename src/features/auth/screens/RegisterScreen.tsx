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
    console.log('🔄 [RegisterScreen] Bắt đầu xử lý đăng ký...');

    if (!validateForm()) {
      console.log('❌ [RegisterScreen] Validate form không hợp lệ. Lỗi hiện tại:', errors);
      return;
    }

    const payload = {
      code: `US${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
      userName: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    console.log('📤 [RegisterScreen] Dữ liệu chuẩn bị gửi (Payload):', JSON.stringify(payload, null, 2));

    try {
      setIsLoading(true);
      const response = await authService.register(payload);

      console.log('✅ [RegisterScreen] Server phản hồi thành công:', response);

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
      console.error('❌ [RegisterScreen] Lỗi khi nhận phản hồi từ Backend:', error);
      Alert.alert('Lỗi đăng ký', error.message || MESSAGES.ERROR.UNKNOWN);
    } finally {
      setIsLoading(false);
      console.log('🛑 [RegisterScreen] Hoàn tất quá trình đăng ký (End Function).');
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

        <Text style={styles.title}>Đăng ký tài khoản</Text>

        <Text style={styles.subtitle}>
          Chào mừng đến với ứng dụng đỗ xe thông minh
        </Text>

        <Input
          label="Họ và tên"
          placeholder="Nhập họ và tên"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />

        <Input
          label="Email"
          placeholder="Nhập email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <Input
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Xác nhận mật khẩu"
          placeholder="Nhập xác nhận mật khẩu"
          value={formData.confirmPassword}
          onChangeText={(text) =>
            setFormData({ ...formData, confirmPassword: text })
          }
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Đăng ký"
          onPress={handleRegister}
          loading={isLoading}
          fullWidth
          style={styles.registerButton}
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
          <View style={styles.line} />
        </View>

        {/* Social login */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Icon name="logo-apple" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Icon name="logo-google" size={28} color="#DB4437" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Icon name="logo-facebook" size={28} color="#1877F2" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({

  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl
  },

  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm
  },

  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl
  },

  registerButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: SPACING.sm,
    height: 48,
    justifyContent: 'center'
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight
  },

  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary
  },

  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: SPACING.xl
  },

  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center'
  },

  footerText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary
  },

  footerLink: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.fontWeight.semibold
  }

})

export default RegisterScreen;