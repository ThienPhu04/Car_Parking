import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { validate } from '../../../shared/utils/validation';
import { useAuth } from '../../../store/AuthContext';
import { UpdateUserPayload } from '../../../types/auth.types';

type FormState = {
  userName: string;
  email: string;
  phone: string;
};

type FormErrors = Record<keyof FormState, string>;

const createEmptyErrors = (): FormErrors => ({
  userName: '',
  email: '',
  phone: '',
});

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isGuest = !!user?.isGuest;

  useEffect(() => {
    if (!isGuest) {
      return;
    }

    Alert.alert(
      'Thông báo',
      'Tài khoản khách không hỗ trợ chỉnh sửa hồ sơ.',
      [{ text: 'Đã hiểu', onPress: () => navigation.goBack() }]
    );
  }, [isGuest, navigation]);

  const initialValues = useMemo(
    () => ({
      userName: user?.userName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone?.toString() || '',
    }),
    [user?.email, user?.name, user?.phone, user?.userName]
  );

  const [formData, setFormData] = useState<FormState>({
    ...initialValues,
  });
  const [errors, setErrors] = useState<FormErrors>(createEmptyErrors());

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = createEmptyErrors();
    let isValid = true;

    if (!formData.userName.trim()) {
      nextErrors.userName = 'Vui lòng nhập tên người dùng';
      isValid = false;
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!validate.email(formData.email.trim())) {
      nextErrors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!validate.phone(formData.phone.trim())) {
      nextErrors.phone = 'Số điện thoại không hợp lệ';
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const buildPayload = (): UpdateUserPayload => {
    const payload: UpdateUserPayload = {};
    const nextUserName = formData.userName.trim();
    const nextEmail = formData.email.trim();
    const nextPhone = formData.phone.trim();
    const currentUserName = initialValues.userName.trim();
    const currentEmail = initialValues.email.trim().toLowerCase();
    const currentPhone = initialValues.phone.trim();

    if (nextUserName !== currentUserName) {
      payload.userName = nextUserName;
    }

    if (nextPhone !== currentPhone) {
      payload.phone = nextPhone;
    }

    if (nextEmail.toLowerCase() !== currentEmail) {
      payload.email = nextEmail;
    }

    return payload;
  };

  const handleSave = async () => {
    if (isGuest) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = buildPayload();
    const emailChanged =
      !!payload.email &&
      payload.email.trim().toLowerCase() !==
        initialValues.email.trim().toLowerCase();

    if (Object.keys(payload).length === 0) {
      Alert.alert('Thông báo', 'Không có thông tin nào thay đổi');
      return;
    }

    try {
      setIsLoading(true);
      const result = await updateUser(payload);
      Alert.alert(
        'Thành công',
        result.message ||
          (emailChanged
            ? 'Cập nhật thành công. Vui lòng kiểm tra email để xác thực địa chỉ mới.'
            : 'Đã cập nhật thông tin cá nhân')
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  if (isGuest) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={24}
          color={COLORS.textPrimary}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={50} color={COLORS.primary} />
            </View>
            <Text style={styles.changeAvatarText}>
              Cập nhật thông tin tài khoản
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Mã người dùng"
              value={user?.code || ''}
              editable={false}
              leftIcon="id-card-outline"
            />

            <Input
              label="Tên người dùng *"
              placeholder="Nhập tên của bạn"
              value={formData.userName}
              onChangeText={(text) => updateField('userName', text)}
              error={errors.userName}
              leftIcon="person-outline"
            />

            <Input
              label="Email *"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Input
              label="Số điện thoại *"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              error={errors.phone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <View style={styles.infoBox}>
              <Icon
                name="information-circle-outline"
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>
                Nếu đổi email, hệ thống sẽ gửi mail xác thực tới địa chỉ mới.
              </Text>
            </View>
          </View>

          <Button
            title="Lưu thay đổi"
            onPress={handleSave}
            loading={isLoading}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  changeAvatarText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  form: {
    gap: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.xxl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.textSecondary}10`,
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default EditProfileScreen;
