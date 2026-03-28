import { Vehicle, VehicleType } from '../../../types/vehicle.types';

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        return trimmedValue;
      }
    }
  }

  return '';
};

const pickBoolean = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true' || normalizedValue === '1') {
        return true;
      }

      if (normalizedValue === 'false' || normalizedValue === '0') {
        return false;
      }
    }
  }

  return false;
};

const normalizeVehicleType = (value?: unknown): VehicleType => {
  if (typeof value !== 'string') {
    return VehicleType.CAR;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue.includes('motor')) {
    return VehicleType.MOTORCYCLE;
  }

  if (normalizedValue.includes('truck')) {
    return VehicleType.TRUCK;
  }

  return VehicleType.CAR;
};

const splitVehicleName = (value?: unknown) => {
  if (typeof value !== 'string') {
    return { brand: '', model: '' };
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return { brand: '', model: '' };
  }

  return {
    brand: normalizedValue,
    model: '',
  };
};

export const buildVehicleName = (brand?: string, model?: string) => {
  const normalizedName = `${brand || ''} ${model || ''}`.trim();
  return normalizedName || 'Xe cua toi';
};

export const normalizeVehicle = (
  rawVehicle: any,
  fallbackVehicle: Partial<Vehicle> = {},
): Vehicle => {
  const fallbackName = splitVehicleName(rawVehicle?.nameVehicles);

  return {
    id: pickString(
      rawVehicle?.code,
      rawVehicle?.id,
      rawVehicle?._id,
      rawVehicle?.vehicleId,
      fallbackVehicle.id,
    ),
    userId: pickString(
      rawVehicle?.userId?.code,
      rawVehicle?.userId,
      rawVehicle?.userCode,
      rawVehicle?.createdBy,
      fallbackVehicle.userId,
    ),
    licensePlate: pickString(
      rawVehicle?.licensePlate,
      rawVehicle?.plateNumber,
      rawVehicle?.bienSo,
      fallbackVehicle.licensePlate,
    ),
    type: normalizeVehicleType(rawVehicle?.type ?? fallbackVehicle.type),
    brand: pickString(rawVehicle?.brand, fallbackVehicle.brand, fallbackName.brand),
    model: pickString(rawVehicle?.model, fallbackVehicle.model, fallbackName.model),
    color: pickString(rawVehicle?.color, fallbackVehicle.color),
    isDefault: pickBoolean(
      rawVehicle?.isDefault,
      rawVehicle?.default,
      rawVehicle?.statusDefault,
      rawVehicle?.isDefaultVehicle,
      fallbackVehicle.isDefault,
    ),
  };
};

export const normalizeVehicleList = (payload: any): Vehicle[] => {
  const rawVehicles = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.rows)
        ? payload.rows
        : Array.isArray(payload?.list)
          ? payload.list
          : Array.isArray(payload?.vehicles)
            ? payload.vehicles
            : [];

  return rawVehicles
    .map((vehicle: any) => normalizeVehicle(vehicle))
    .filter((vehicle: Vehicle) => Boolean(vehicle.id || vehicle.licensePlate));
};

export const normalizeVehicleResponse = (
  payload: any,
  fallbackVehicle?: Partial<Vehicle>,
): Vehicle | null => {
  const rawVehicle = payload?.vehicle
    ?? payload?.item
    ?? payload?.data
    ?? payload;

  if (rawVehicle && typeof rawVehicle === 'object' && !Array.isArray(rawVehicle)) {
    return normalizeVehicle(rawVehicle, fallbackVehicle);
  }

  if (fallbackVehicle) {
    return normalizeVehicle(fallbackVehicle, fallbackVehicle);
  }

  return null;
};
