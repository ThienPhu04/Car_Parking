import {
  ParkingPaymentStatus,
  ParkingSession,
  ParkingSessionStatus,
} from '../../../types/parkingSession.types';

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

const pickNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return 0;
};

const unwrapSessionPayload = (payload: any): any[] => {
  let current = payload;

  while (current && typeof current === 'object' && !Array.isArray(current)) {
    if (Array.isArray(current.data)) {
      return current.data;
    }

    if (Array.isArray(current.items)) {
      return current.items;
    }

    if (current.data && typeof current.data === 'object') {
      current = current.data;
      continue;
    }

    break;
  }

  return Array.isArray(current) ? current : [];
};

const normalizeSessionStatus = (status: unknown): ParkingSessionStatus => {
  return Number(status) === ParkingSessionStatus.COMPLETED
    ? ParkingSessionStatus.COMPLETED
    : ParkingSessionStatus.ONGOING;
};

const normalizePaymentStatus = (status: unknown): ParkingPaymentStatus => {
  return Number(status) === ParkingPaymentStatus.PAID
    ? ParkingPaymentStatus.PAID
    : ParkingPaymentStatus.UNPAID;
};

export const normalizeParkingSession = (rawSession: any): ParkingSession => {
  const slotSource = rawSession?.slotId;
  const bookingSource = rawSession?.bookingId;
  const licensePlateSource = rawSession?.licensePlateId;
  const vehicleSource = rawSession?.vehicleId;
  const floorLevel =
    typeof slotSource?.floorLevel === 'number'
      ? slotSource.floorLevel
      : typeof slotSource?.floor === 'number'
        ? slotSource.floor
        : undefined;
  const floorLabel =
    typeof floorLevel === 'number' && floorLevel > 0
      ? `Tầng ${floorLevel}`
      : '';

  return {
    id: pickString(rawSession?.id, rawSession?._id, rawSession?.code),
    code: pickString(rawSession?.code),
    userId: pickString(rawSession?.userId?.code, rawSession?.userId?._id, rawSession?.userId),
    status: normalizeSessionStatus(rawSession?.status),
    statusName:
      pickString(rawSession?.statusName)
      || (Number(rawSession?.status) === ParkingSessionStatus.COMPLETED ? 'COMPLETED' : 'ONGOING'),
    paymentStatus: normalizePaymentStatus(rawSession?.statusPayment),
    paymentStatusName:
      pickString(rawSession?.statusPaymentName)
      || (Number(rawSession?.statusPayment) === ParkingPaymentStatus.PAID ? 'PAID' : 'UNPAID'),
    price: pickNumber(rawSession?.price),
    checkInTime: pickString(rawSession?.checkInTime),
    checkOutTime: pickString(rawSession?.checkOutTime) || undefined,
    createdAt: pickString(rawSession?.createdAt) || undefined,
    updatedAt: pickString(rawSession?.updatedAt) || undefined,
    bookingCode: pickString(bookingSource?.code, rawSession?.bookingCode) || undefined,
    slotCode: pickString(slotSource?.code, slotSource?.nameSlot, rawSession?.slotCode) || undefined,
    slotName: pickString(slotSource?.nameSlot, rawSession?.slotName) || undefined,
    floorLabel: floorLabel || undefined,
    plateNumber: pickString(
      licensePlateSource?.plateNumber,
      vehicleSource?.licensePlate,
      rawSession?.plateNumber,
    ) || undefined,
    vehicleName: pickString(vehicleSource?.nameVehicles, rawSession?.vehicleName) || undefined,
  };
};

export const normalizeParkingSessionList = (payload: any): ParkingSession[] => {
  const sessions = unwrapSessionPayload(payload);

  return sessions
    .map((session: any) => normalizeParkingSession(session))
    .filter((session: ParkingSession) => Boolean(session.id));
};
