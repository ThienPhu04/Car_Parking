import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/colors';
import { SettingItem } from '../components/SettingItem';
import { storage } from '../../../shared/utils/storage';
import { CONFIG } from '../../../shared/constants/config';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: {
      bookingReminders: true,
      slotAvailable: true,
      promotions: false,
      systemUpdates: true,
    },
    appearance: {
      darkMode: false,
      language: 'vi',
    },
    preferences: {
      autoSaveLocation: true,
      showParkingHistory: true,
      vibration: true,
      sound: true,
    },
  });

  const handleToggle = async (
    category: keyof typeof settings,
    key: string,
    value: boolean
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    setSettings(newSettings);

    try {
      await storage.setItem('app_settings', newSettings);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Xóa bộ nhớ cache',
      'Bạn có chắc muốn xóa toàn bộ dữ liệu cache?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            // Clear cache logic here
            Alert.alert('Thành công', 'Đã xóa bộ nhớ cache');
          },
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Chọn ngôn ngữ',
      '',
      [
        {
          text: 'Tiếng Việt',
          onPress: () =>
            setSettings({
              ...settings,
              appearance: { ...settings.appearance, language: 'vi' },
            }),
        },
        {
          text: 'English',
          onPress: () =>
            setSettings({
              ...settings,
              appearance: { ...settings.appearance, language: 'en' },
            }),
        },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          
          <SettingItem
            icon="notifications-outline"
            label="Nhắc nhở đặt chỗ"
            subtitle="Nhận thông báo trước khi hết giờ đặt chỗ"
            renderRight={() => (
              <Switch
                value={settings.notifications.bookingReminders}
                onValueChange={(value) =>
                  handleToggle('notifications', 'bookingReminders', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="checkmark-circle-outline"
            label="Chỗ trống khả dụng"
            subtitle="Thông báo khi có chỗ trống"
            renderRight={() => (
              <Switch
                value={settings.notifications.slotAvailable}
                onValueChange={(value) =>
                  handleToggle('notifications', 'slotAvailable', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="pricetag-outline"
            label="Khuyến mãi"
            subtitle="Nhận thông báo về ưu đãi và khuyến mãi"
            renderRight={() => (
              <Switch
                value={settings.notifications.promotions}
                onValueChange={(value) =>
                  handleToggle('notifications', 'promotions', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="information-circle-outline"
            label="Cập nhật hệ thống"
            subtitle="Thông báo về cập nhật ứng dụng"
            renderRight={() => (
              <Switch
                value={settings.notifications.systemUpdates}
                onValueChange={(value) =>
                  handleToggle('notifications', 'systemUpdates', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giao diện</Text>

          <SettingItem
            icon="moon-outline"
            label="Chế độ tối"
            subtitle="Sử dụng giao diện tối"
            renderRight={() => (
              <Switch
                value={settings.appearance.darkMode}
                onValueChange={(value) =>
                  handleToggle('appearance', 'darkMode', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="language-outline"
            label="Ngôn ngữ"
            subtitle={settings.appearance.language === 'vi' ? 'Tiếng Việt' : 'English'}
            onPress={handleLanguageChange}
            showChevron
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chọn</Text>

          <SettingItem
            icon="location-outline"
            label="Tự động lưu vị trí xe"
            subtitle="Lưu vị trí xe khi đỗ"
            renderRight={() => (
              <Switch
                value={settings.preferences.autoSaveLocation}
                onValueChange={(value) =>
                  handleToggle('preferences', 'autoSaveLocation', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="time-outline"
            label="Hiển thị lịch sử"
            subtitle="Hiển thị lịch sử đỗ xe"
            renderRight={() => (
              <Switch
                value={settings.preferences.showParkingHistory}
                onValueChange={(value) =>
                  handleToggle('preferences', 'showParkingHistory', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="phone-portrait-outline"
            label="Rung"
            subtitle="Rung khi có thông báo"
            renderRight={() => (
              <Switch
                value={settings.preferences.vibration}
                onValueChange={(value) =>
                  handleToggle('preferences', 'vibration', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />

          <SettingItem
            icon="volume-high-outline"
            label="Âm thanh"
            subtitle="Âm thanh thông báo"
            renderRight={() => (
              <Switch
                value={settings.preferences.sound}
                onValueChange={(value) =>
                  handleToggle('preferences', 'sound', value)
                }
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dữ liệu & Bộ nhớ</Text>

          <SettingItem
            icon="trash-outline"
            label="Xóa bộ nhớ cache"
            subtitle="Giải phóng dung lượng lưu trữ"
            onPress={handleClearCache}
            showChevron
          />

          <SettingItem
            icon="cloud-download-outline"
            label="Tự động đồng bộ"
            subtitle="Đồng bộ dữ liệu với cloud"
            renderRight={() => (
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            )}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về ứng dụng</Text>

          <SettingItem
            icon="information-circle-outline"
            label="Phiên bản"
            subtitle="1.0.0"
          />

          <SettingItem
            icon="document-text-outline"
            label="Điều khoản sử dụng"
            onPress={() => Alert.alert('Điều khoản', 'Tính năng đang phát triển')}
            showChevron
          />

          <SettingItem
            icon="shield-checkmark-outline"
            label="Chính sách bảo mật"
            onPress={() => Alert.alert('Bảo mật', 'Tính năng đang phát triển')}
            showChevron
          />

          <SettingItem
            icon="help-circle-outline"
            label="Trợ giúp & Hỗ trợ"
            onPress={() => Alert.alert('Hỗ trợ', 'Email: support@smartparking.com')}
            showChevron
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
});

export default SettingsScreen;