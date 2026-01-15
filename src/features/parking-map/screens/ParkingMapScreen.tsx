import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { ParkingGrid } from '../components/ParkingGrid';
import { FloorSelector } from '../components/FloorSelector';
import { SlotLegend } from '../components/SlotLegend';
import { useParkingSlots } from '../hooks/useParkingSlots';
import { useMQTT } from '../hooks/useMQTT';
import { Loading } from '../../../shared/components/Loading';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { MQTT_TOPICS } from '../../../shared/constants/mqttTopics';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

const { width } = Dimensions.get('window');

const ParkingMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  
  const lotId = 'lot_001'; // Mock data
  const {
    slots,
    isLoading,
    error,
    updateSlotStatus,
    getNearestSlot,
  } = useParkingSlots(lotId, selectedFloor);

  // MQTT real-time updates
  const { isConnected } = useMQTT(
    MQTT_TOPICS.SLOT_STATUS(lotId, selectedFloor),
    (message) => {
      updateSlotStatus(message.slotId, message.status);
    }
  );

  const handleSlotPress = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    
    if (slot.status === SlotStatus.AVAILABLE) {
      Alert.alert(
        `Chỗ ${slot.code}`,
        `Bạn muốn đặt chỗ này?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đặt chỗ',
            onPress: () => handleBooking(slot),
          },
          {
            text: 'Dẫn đường',
            onPress: () => handleNavigation(slot),
          },
        ]
      );
    }
  };

  const handleBooking = (slot: ParkingSlot) => {
    (navigation as any).navigate('Booking' as any, { slotId: slot.id });
  };

  const handleNavigation = (slot: ParkingSlot) => {
    // TODO: Implement navigation
    Alert.alert('Dẫn đường', `Đang dẫn đường đến ${slot.code}`);
  };

  const handleFindNearest = () => {
    const nearest = getNearestSlot({ x: 0, y: 0 });
    if (nearest) {
      setSelectedSlot(nearest);
      Alert.alert('Chỗ gần nhất', `Đã tìm thấy chỗ ${nearest.code}`);
    } else {
      Alert.alert('Thông báo', 'Không có chỗ trống');
    }
  };

  if (isLoading) {
    return <Loading fullscreen text="Đang tải bản đồ..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Không thể tải bản đồ bãi đỗ</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? COLORS.success : COLORS.error },
            ]}
          />
          <Text style={styles.headerTitle}>
            {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleFindNearest} style={styles.findButton}>
          <Icon name="locate" size={20} color={COLORS.primary} />
          <Text style={styles.findButtonText}>Tìm chỗ gần</Text>
        </TouchableOpacity>
      </View>

      <FloorSelector
        selectedFloor={selectedFloor}
        onFloorChange={setSelectedFloor}
        floors={[1, 2, 3, 4]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mapScrollContent}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mapScrollVertical}
        >
          <ParkingGrid
            slots={slots}
            selectedSlot={selectedSlot}
            onSlotPress={handleSlotPress}
          />
        </ScrollView>
      </ScrollView>

      <SlotLegend />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  findButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.xs,
  },
  mapScrollContent: {
    padding: SPACING.md,
  },
  mapScrollVertical: {
    paddingBottom: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default ParkingMapScreen;