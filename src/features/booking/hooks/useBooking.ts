import { useCallback, useState } from 'react';
import { Booking, CreateBookingRequest, BookingStatus } from '../../../types/booking.types';
import { bookingService } from '../services/bookingService';
import { useNotifications } from '../../../store/NotificationContext';
import { NotificationType } from '../../../types/notification.types';
import { useAuth } from '../../../store/AuthContext';
import {
  normalizeBookingList,
  normalizeBookingResponse,
} from '../utils/bookingAdapters';

export const useBooking = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const fetchBookings = useCallback(async () => {
    try {
      if (!user?.code) {
        setBookings([]);
        return [];
      }

      setIsLoading(true);
      setError(null);

      const response = await bookingService.getBookings({ userId: user.code });
      const normalizedBookings = normalizeBookingList(response.data);
      setBookings(normalizedBookings);
      return normalizedBookings;
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching bookings:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.code]);

  const createBooking = useCallback(async (data: CreateBookingRequest) => {
    try {
      if (!user?.code) {
        throw new Error('Khong tim thay ma nguoi dung');
      }

      setIsLoading(true);
      setError(null);

      const payload = {
        userId: user.code,
        vehiclesId: data.vehicleId,
        expectedArrivalTime: data.expectedArrivalTime,
        status: data.status ?? 2,
      };

      const response = await bookingService.createBooking(payload);
      let newBooking = normalizeBookingResponse(response.data);

      if (!newBooking?.id) {
        const normalizedBookings = await fetchBookings();
        newBooking =
          normalizedBookings.find(
            booking =>
              booking.vehicleId === data.vehicleId
              && booking.startTime === data.expectedArrivalTime,
          )
          ?? normalizedBookings[0]
          ?? null;
      } else {
        setBookings(prevBookings => {
          const nextBookings = prevBookings.filter(
            booking => booking.id !== newBooking?.id,
          );
          return [newBooking!, ...nextBookings];
        });
      }

      if (newBooking) {
        setActiveBooking(newBooking);

        addNotification({
          type: NotificationType.BOOKING_REMINDER,
          title: 'Nhac nho dat cho',
          message: newBooking.slot?.code
            ? `Gan den gio dat cho tai ${newBooking.slot.code}`
            : 'Gan den gio vao bai xe theo lich da dat',
          data: { bookingId: newBooking.id },
        });
      }

      return newBooking;
    } catch (err) {
      setError(err as Error);
      console.error('Error creating booking:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, fetchBookings, user?.code]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      if (!user?.code) {
        throw new Error('Khong tim thay ma nguoi dung');
      }

      const targetBooking = bookings.find(
        booking => booking.id === id || booking.code === id,
      );
      const bookingCode = targetBooking?.code ?? id;

      setIsLoading(true);
      setError(null);
      await bookingService.cancelBooking({
        bookingCode,
        userCode: user.code,
      });

      setBookings(prev =>
        prev.map(booking =>
          booking.id === id || booking.code === bookingCode
            ? {
                ...booking,
                status: BookingStatus.CANCELLED,
                statusName: 'Đã hủy',
                slotId: undefined,
              }
            : booking,
        ),
      );

      if (activeBooking?.id === id) {
        setActiveBooking(null);
      }

      addNotification({
        type: NotificationType.SYSTEM,
        title: 'Da huy dat cho',
        message: 'Dat cho cua ban da duoc huy thanh cong',
      });
    } catch (err) {
      setError(err as Error);
      console.error('Error canceling booking:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking, addNotification, bookings, user?.code]);

  const getActiveBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await bookingService.getActiveBooking();
      const booking = normalizeBookingResponse(response.data);
      setActiveBooking(booking);
      return booking;
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching active booking:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bookings,
    activeBooking,
    isLoading,
    error,
    fetchBookings,
    createBooking,
    cancelBooking,
    getActiveBooking,
  };
};
