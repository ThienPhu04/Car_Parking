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

  const floorLabel =
    typeof slotSource?.floorLevel === 'number'
      ? `Tầng ${slotSource.floorLevel}`
      : '';

  return {
    id: pickString(rawSession?.id, rawSession?._id, rawSession?.code),
    code: pickString(rawSession?.code),
    userId: pickString(rawSession?.userId?.code, rawSession?.userId),
    status: normalizeSessionStatus(rawSession?.status),
    statusName: pickString(rawSession?.statusName),
    paymentStatus: normalizePaymentStatus(rawSession?.statusPayment),
    paymentStatusName: pickString(rawSession?.statusPaymentName),
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
  const sessions = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return sessions
    .map((session: any) => normalizeParkingSession(session))
    .filter((session: ParkingSession) => Boolean(session.id));
};
