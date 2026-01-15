import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { validate } from '../../../shared/utils/validation';
import { useProfile } from '../hooks/useProfile';
import { Vehicle, VehicleType } from '../../../types/vehicle.types';
import { SPACING } from '../../../shared/constants/spacing';

interface VehicleFormModalProps {
  visible: boolean;
  vehicle?: Vehicle;
  onClose: () => void;
  onSuccess: () => void;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  visible,
  vehicle,
  onClose,
  onSuccess,
}) => {
  const { addVehicle, updateVehicle } = useProfile();
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    color: '',
    type: VehicleType.CAR,
  });
  const [errors, setErrors] = useState({ licensePlate: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        color: vehicle.color || '',
        type: vehicle.type,
      });
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors = { licensePlate: '' };
    let isValid = true;

    if (!validate.required(formData.licensePlate)) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe';
      isValid = false;
    } else if (!validate.licensePlate(formData.licensePlate)) {
      newErrors.licensePlate = 'Biển số xe không hợp lệ';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      if (vehicle) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await addVehicle({ ...formData, isDefault: false });
      }
      onSuccess();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu thông tin xe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={vehicle ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
    >
      <View style={styles.form}>
        <Input
          label="Biển số xe *"
          placeholder="VD: 29A-12345"
          value={formData.licensePlate}
          onChangeText={(text) =>
            setFormData({ ...formData, licensePlate: text.toUpperCase() })
          }
          error={errors.licensePlate}
          autoCapitalize="characters"
        />

        <Input
          label="Hãng xe"
          placeholder="VD: Toyota"
          value={formData.brand}
          onChangeText={(text) => setFormData({ ...formData, brand: text })}
        />

        <Input
          label="Model"
          placeholder="VD: Camry"
          value={formData.model}
          onChangeText={(text) => setFormData({ ...formData, model: text })}
        />

        <Input
          label="Màu sắc"
          placeholder="VD: Trắng"
          value={formData.color}
          onChangeText={(text) => setFormData({ ...formData, color: text })}
        />

        <Button
          title={vehicle ? 'Cập nhật' : 'Thêm xe'}
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: SPACING.md,
  },
});