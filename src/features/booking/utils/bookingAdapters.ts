import { Booking, BookingStatus } from '../../../types/booking.types';

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

const unwrapBookingPayload = (payload: any): any => {
  let current = payload;

  while (
    current
    && typeof current === 'object'
    && !Array.isArray(current)
  ) {
    if (Array.isArray(current.data) || Array.isArray(current.items) || Array.isArray(current.list)) {
      return current;
    }

    if (current.data && typeof current.data === 'object') {
      current = current.data;
      continue;
    }

    if (current.item && typeof current.item === 'object') {
      current = current.item;
      continue;
    }

    if (current.booking && typeof current.booking === 'object') {
      current = current.booking;
      continue;
    }

    break;
  }

  return current;
};

const normalizeBookingStatus = (status: unknown, statusName?: unknown): BookingStatus => {
  const normalizedStatusName = typeof statusName === 'string'
    ? statusName.trim().toLowerCase()
    : '';

  if (typeof status === 'string') {
    const normalizedStatus = status.trim().toLowerCase();

    if (normalizedStatus === BookingStatus.ACTIVE) {
      return BookingStatus.ACTIVE;
    }

    if (normalizedStatus === BookingStatus.COMPLETED) {
      return BookingStatus.COMPLETED;
    }

    if (normalizedStatus === BookingStatus.CANCELLED) {
      return BookingStatus.CANCELLED;
    }

    if (normalizedStatus === BookingStatus.EXPIRED) {
      return BookingStatus.EXPIRED;
    }

    if (normalizedStatus === BookingStatus.PENDING) {
      return BookingStatus.PENDING;
    }
  }

  if (typeof status === 'number') {
    if (status === 0) {
      return BookingStatus.CANCELLED;
    }

    if (status === 1) {
      return BookingStatus.ACTIVE;
    }

    if (status === 2) {
      return BookingStatus.PENDING;
    }

    if (status === 3) {
      return BookingStatus.COMPLETED;
    }
  }

  if (normalizedStatusName.includes('huy')) {
    return BookingStatus.CANCELLED;
  }

  if (normalizedStatusName.includes('hoan thanh')) {
    return BookingStatus.COMPLETED;
  }

  if (normalizedStatusName.includes('het han')) {
    return BookingStatus.EXPIRED;
  }

  if (normalizedStatusName.includes('co xe')) {
    return BookingStatus.ACTIVE;
  }

  return BookingStatus.PENDING;
};

export const normalizeBooking = (rawBooking: any): Booking => {
  const slotSource = rawBooking?.slot ?? rawBooking?.slotId;
  const vehicleSource = rawBooking?.vehicle ?? rawBooking?.vehiclesId ?? rawBooking?.vehicleId;
  const startTime = pickString(
    rawBooking?.startTime,
    rawBooking?.expectedArrivalTime,
  );
  const endTime = pickString(
    rawBooking?.endTime,
    rawBooking?.expectedLeaveTime,
  );

  return {
    id: pickString(rawBooking?.id, rawBooking?._id, rawBooking?.code),
    code: pickString(rawBooking?.code),
    userId: pickString(rawBooking?.userId?.code, rawBooking?.userId, rawBooking?.userCode),
    slotId: pickString(
      slotSource?.code,
      slotSource?.nameSlot,
      rawBooking?.slotCode,
      typeof rawBooking?.slotId === 'string' ? rawBooking.slotId : '',
    ) || undefined,
    slot: slotSource
      ? {
          id: pickString(slotSource?.id, slotSource?._id, slotSource?.code),
          code: pickString(slotSource?.code, rawBooking?.slotCode),
          name: pickString(slotSource?.name, slotSource?.nameSlot),
          floorId: pickString(slotSource?.floorId),
          floorLevel:
            typeof slotSource?.floorLevel === 'number'
              ? slotSource.floorLevel
              : typeof slotSource?.floor === 'number'
                ? slotSource.floor
                : 0,
        }
      : undefined,
    vehicleId: pickString(vehicleSource?.code, rawBooking?.vehiclesId, rawBooking?.vehicleId),
    vehicle: vehicleSource || rawBooking?.licensePlate
      ? {
          id: pickString(vehicleSource?.id, vehicleSource?._id, vehicleSource?.code),
          licensePlate: pickString(
            vehicleSource?.licensePlate,
            rawBooking?.licensePlate,
          ),
          brand: pickString(vehicleSource?.brand, vehicleSource?.nameVehicles),
        }
      : undefined,
    startTime,
    endTime: endTime || undefined,
    status: normalizeBookingStatus(rawBooking?.status, rawBooking?.statusName),
    statusName: pickString(rawBooking?.statusName),
    licensePlate: pickString(rawBooking?.licensePlate),
    createdAt: pickString(rawBooking?.createdAt, rawBooking?.updatedAt, startTime),
    qrCode: pickString(rawBooking?.qrCode),
  };
};

export const normalizeBookingList = (payload: any): Booking[] => {
  const unwrappedPayload = unwrapBookingPayload(payload);
  const rawBookings = Array.isArray(unwrappedPayload)
    ? unwrappedPayload
    : Array.isArray(unwrappedPayload?.data)
      ? unwrappedPayload.data
      : Array.isArray(unwrappedPayload?.items)
        ? unwrappedPayload.items
        : Array.isArray(unwrappedPayload?.list)
          ? unwrappedPayload.list
        : [];

  return rawBookings
    .map((booking: any) => normalizeBooking(booking))
    .filter((booking: Booking) => Boolean(booking.id || booking.code));
};

export const normalizeBookingResponse = (payload: any): Booking | null => {
  const rawBooking = unwrapBookingPayload(payload);

  if (rawBooking && typeof rawBooking === 'object' && !Array.isArray(rawBooking)) {
    return normalizeBooking(rawBooking);
  }

  return null;
};
