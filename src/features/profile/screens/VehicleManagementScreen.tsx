import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { VehicleCard } from '../components/VehicleCard';
import { useProfile } from '../hooks/useProfile';
import { Vehicle, VehicleType } from '../../../types/vehicle.types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { validate } from '../../../shared/utils/validation';

const VehicleManagementScreen: React.FC = () => {
  const { vehicles, isLoading, fetchVehicles, deleteVehicle, addVehicle, updateVehicle } =
  useProfile();
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // Form State
  const [nameVehicles, setNameVehicles] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [errors, setErrors] = useState({ nameVehicles: '', licensePlate: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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


  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNameVehicles(vehicle.brand || '');
    setLicensePlate(vehicle.licensePlate);
    setIsFormVisible(true);
  };

  const resetForm = () => {
    setNameVehicles('');
    setLicensePlate('');
    setErrors({ nameVehicles: '', licensePlate: '' });
    setEditingVehicle(null);
    setIsFormVisible(false);
  };

  const validateForm = () => {
    const newErrors = { nameVehicles: '', licensePlate: '' };
    let isValid = true;

    if (!validate.required(nameVehicles)) {
      newErrors.nameVehicles = 'Vui lòng nhập tên xe';
      isValid = false;
    }

    if (!validate.required(licensePlate)) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe';
      isValid = false;
    } else if (!validate.licensePlate(licensePlate)) {
      newErrors.licensePlate = 'Biển số xe không hợp lệ';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          brand: nameVehicles,
          licensePlate: licensePlate.toUpperCase(),
        });
        Alert.alert('Thành công', 'Đã cập nhật thông tin xe');
      } else {
        await addVehicle({
          brand: nameVehicles,
          model: '',
          color: '',
          type: VehicleType.CAR,
          licensePlate: licensePlate.toUpperCase(),
          isDefault: false,
        });
        Alert.alert('Thành công', 'Đã thêm xe mới');
      }
      resetForm();
      fetchVehicles();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể lưu thông tin xe');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading fullscreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách xe</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (isFormVisible || editingVehicle) {
              resetForm();
            } else {
              setIsFormVisible(true);
            }
          }}
        >
          <Icon 
            name={(isFormVisible || editingVehicle) ? "close" : "add"} 
            size={24} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {vehicles.length === 0 && !isFormVisible ? (
          <EmptyState
            icon="car-outline"
            title="Chưa có xe nào"
            description="Thêm thông tin xe để đặt chỗ đỗ"
            actionLabel="Thêm xe"
            onAction={() => setIsFormVisible(true)}
          />
        ) : (
          <>
            {vehicles.length > 0 && (
              <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id || item.licensePlate}
                renderItem={({ item }) => (
                  <VehicleCard
                    vehicle={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                style={{ flex: 1 }}
              />
            )}

            {(isFormVisible || editingVehicle) && (
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {editingVehicle ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
                  </Text>
                  <TouchableOpacity onPress={resetForm}>
                    <Icon name="close-circle" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.inputWrapper}>
                    <Input
                      label="Tên xe *"
                      placeholder="VD: Toyota Camry"
                      value={nameVehicles}
                      onChangeText={setNameVehicles}
                      error={errors.nameVehicles}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Input
                      label="Biển số xe *"
                      placeholder="VD: 29A-12345"
                      value={licensePlate}
                      onChangeText={(text) => setLicensePlate(text.toUpperCase())}
                      error={errors.licensePlate}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <Button
                  title={editingVehicle ? 'Cập nhật' : 'Thêm xe'}
                  onPress={handleSubmit}
                  loading={isSaving}
                  fullWidth
                />
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
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
  formContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
  },
});

export default VehicleManagementScreen;
