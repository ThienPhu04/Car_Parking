import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { useAuth } from '../../../store/AuthContext';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    userName: user?.userName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone?.toString() || '',
  });

  const [errors, setErrors] = useState({
    userName: '',
    phone: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { userName: '', phone: '' };

    if (!formData.userName.trim()) {
      newErrors.userName = 'Vui lòng nhập tên người dùng';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await updateUser({
        userName: formData.userName,
        phone: formData.phone,
      });
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

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
        <View style={{ width: 24 }} />
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
            <Text style={styles.changeAvatarText}>Thay đổi ảnh đại diện</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Mã người dùng"
              value={user?.code || ''}
              editable={false}
              icon="id-card-outline"
            />

            <Input
              label="Tên người dùng *"
              placeholder="Nhập tên của bạn"
              value={formData.userName}
              onChangeText={(text) => setFormData({ ...formData, userName: text })}
              error={errors.userName}
              icon="person-outline"
            />

            <Input
              label="Email"
              value={formData.email}
              editable={false}
              icon="mail-outline"
            />

            <Input
              label="Số điện thoại *"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              error={errors.phone}
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <View style={styles.infoBox}>
              <Icon name="information-circle-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                Email và Mã người dùng không thể thay đổi để đảm bảo tính bảo mật.
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
