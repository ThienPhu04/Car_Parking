import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFormModal } from '../components/VehicleFormModal';
import { useProfile } from '../hooks/useProfile';
import { Vehicle } from '../../../types/vehicle.types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

const VehicleManagementScreen: React.FC = () => {
  const { vehicles, isLoading, fetchVehicles, deleteVehicle, setDefaultVehicle } =
    useProfile();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = (vehicleId: string) => {
    Alert.alert('Xóa xe', 'Bạn có chắc muốn xóa xe này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(vehicleId);
            Alert.alert('Thành công', 'Đã xóa xe');
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa xe');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (vehicleId: string) => {
    try {
      await setDefaultVehicle(vehicleId);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đặt làm xe mặc định');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
  };

  if (isLoading) {
    return <Loading fullscreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý xe</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title="Chưa có xe nào"
          description="Thêm thông tin xe để đặt chỗ đỗ"
          actionLabel="Thêm xe"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
              onSetDefault={() => handleSetDefault(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <VehicleFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchVehicles();
        }}
      />

      {editingVehicle && (
        <VehicleFormModal
          visible={!!editingVehicle}
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={() => {
            setEditingVehicle(null);
            fetchVehicles();
          }}
        />
      )}
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
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
});

export default VehicleManagementScreen;