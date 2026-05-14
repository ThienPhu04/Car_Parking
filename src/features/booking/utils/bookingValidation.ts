import { CONFIG } from '../../../shared/constants/config';

const BOOKING_INTERVAL_MINUTES = 30;

export const BOOKING_RESTRICTED_HOURS_MESSAGE =
  `Bãi giữ xe không nhận đặt lịch từ ${CONFIG.BOOKING_RESTRICTED_HOURS.START}h-${CONFIG.BOOKING_RESTRICTED_HOURS.END}h`;

const roundUpToNextInterval = (date: Date, intervalMinutes: number) => {
  const roundedDate = new Date(date);
  roundedDate.setSeconds(0, 0);

  const minutes = roundedDate.getMinutes();
  const remainder = minutes % intervalMinutes;

  if (remainder !== 0) {
    roundedDate.setMinutes(minutes + (intervalMinutes - remainder));
  }

  if (roundedDate.getTime() < date.getTime()) {
    roundedDate.setMinutes(roundedDate.getMinutes() + intervalMinutes);
  }

  return roundedDate;
};

export const getBookingMinArrivalDate = (now = new Date()) =>
  new Date(now.getTime() + CONFIG.MIN_BOOKING_DURATION_MINUTES * 60 * 1000);

export const getBookingMaxArrivalDate = (now = new Date()) =>
  new Date(
    now.getTime() + CONFIG.MAX_BOOKING_ADVANCE_DAYS * 24 * 60 * 60 * 1000,
  );

export const isRestrictedBookingHour = (date: Date) => {
  const hour = date.getHours();

  return (
    hour >= CONFIG.BOOKING_RESTRICTED_HOURS.START
    || hour < CONFIG.BOOKING_RESTRICTED_HOURS.END
  );
};

export const getNextAllowedBookingTime = (date: Date) => {
  if (!isRestrictedBookingHour(date)) {
    return date;
  }

  const nextAllowedDate = new Date(date);

  if (date.getHours() >= CONFIG.BOOKING_RESTRICTED_HOURS.START) {
    nextAllowedDate.setDate(nextAllowedDate.getDate() + 1);
  }

  nextAllowedDate.setHours(CONFIG.BOOKING_RESTRICTED_HOURS.END, 0, 0, 0);
  return nextAllowedDate;
};

export const getDefaultBookingArrivalTime = (now = new Date()) => {
  const minArrivalDate = getBookingMinArrivalDate(now);
  const roundedDate = roundUpToNextInterval(
    minArrivalDate,
    BOOKING_INTERVAL_MINUTES,
  );

  return getNextAllowedBookingTime(roundedDate);
};

export const validateBookingArrivalTime = (
  arrivalTime: Date,
  now = new Date(),
) => {
  const minArrivalDate = getBookingMinArrivalDate(now);
  const maxArrivalDate = getBookingMaxArrivalDate(now);

  if (
    arrivalTime.getTime() < minArrivalDate.getTime()
    || arrivalTime.getTime() > maxArrivalDate.getTime()
  ) {
    return `Thời gian đặt phải sau ${CONFIG.MIN_BOOKING_DURATION_MINUTES} phút và trước ${CONFIG.MAX_BOOKING_ADVANCE_DAYS} ngày`;
  }

  if (isRestrictedBookingHour(arrivalTime)) {
    return BOOKING_RESTRICTED_HOURS_MESSAGE;
  }

  return null;
};
