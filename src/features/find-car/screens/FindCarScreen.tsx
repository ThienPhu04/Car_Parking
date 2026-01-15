import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../../../shared/constants/colors';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { useCarLocation } from '../hooks/useCarLocation';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

const { width, height } = Dimensions.get('window');

const FindCarScreen: React.FC = () => {
  const { carLocation, isLoading, getCarLocation, saveCarLocation, clearCarLocation } =
    useCarLocation();
  const [region, setRegion] = useState({
    latitude: 20.9817,
    longitude: 105.9571,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    loadCarLocation();
  }, []);

  const loadCarLocation = async () => {
    await getCarLocation();
  };

  const handleSaveCurrentLocation = async () => {
    Alert.alert(
      'Lưu vị trí xe',
      'Bạn muốn lưu vị trí hiện tại làm vị trí xe?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Lưu',
          onPress: async () => {
            try {
              await saveCarLocation({
                slotId: 'A1-05',
                slotCode: 'A1-05',
                floor: 1,
                position: { x: 0, y: 0 },
                timestamp: new Date().toISOString(),
              });
              Alert.alert('Thành công', 'Đã lưu vị trí xe');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể lưu vị trí');
            }
          },
        },
      ]
    );
  };

  const handleClearLocation = () => {
    Alert.alert(
      'Xóa vị trí xe',
      'Bạn có chắc muốn xóa vị trí đã lưu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await clearCarLocation();
            Alert.alert('Thành công', 'Đã xóa vị trí xe');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullscreen />;
  }

  if (!carLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="car-outline"
          title="Chưa lưu vị trí xe"
          description="Lưu vị trí xe của bạn để dễ dàng tìm lại sau này"
          actionLabel="Lưu vị trí hiện tại"
          onAction={handleSaveCurrentLocation}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="Xe của bạn"
            description={`${carLocation.slotCode} - Tầng ${carLocation.floor}`}
          >
            <View style={styles.carMarker}>
              <Icon name="car" size={32} color={COLORS.primary} />
            </View>
          </Marker>
        </MapView>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Icon name="location" size={24} color={COLORS.primary} />
          <Text style={styles.infoTitle}>Vị trí xe của bạn</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã chỗ:</Text>
          <Text style={styles.infoValue}>{carLocation.slotCode}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tầng:</Text>
          <Text style={styles.infoValue}>Tầng {carLocation.floor}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Thời gian:</Text>
          <Text style={styles.infoValue}>
            {new Date(carLocation.timestamp).toLocaleString('vi-VN')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Dẫn đường"
            onPress={() => Alert.alert('Dẫn đường', 'Tính năng đang phát triển')}
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title="Cập nhật vị trí"
            onPress={handleSaveCurrentLocation}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title="Xóa vị trí"
            onPress={handleClearLocation}
            variant="text"
            fullWidth
          />
        </View>
      </Card>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width,
    height: height * 0.5,
  },
  carMarker: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoCard: {
    margin: SPACING.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  actions: {
    marginTop: SPACING.md,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
});

export default FindCarScreen;