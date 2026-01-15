import { useState, useCallback } from 'react';
import { Booking, CreateBookingRequest, BookingStatus } from '../../../types/booking.types';
import { bookingService } from '../services/bookingService';
import { useNotifications } from '../../../store/NotificationContext';
import { NotificationType } from '../../../types/notification.types';

export const useBooking = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotifications();

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await bookingService.getBookings();
      setBookings(response.data.items);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (data: CreateBookingRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await bookingService.createBooking(data);
      const newBooking = response.data;
      
      setBookings(prev => [newBooking, ...prev]);
      setActiveBooking(newBooking);

      // Schedule reminder notification
      const reminderTime = new Date(newBooking.startTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - 5);

      addNotification({
        type: NotificationType.BOOKING_REMINDER,
        title: 'Nhắc nhở đặt chỗ',
        message: `Còn 5 phút nữa đến giờ đặt chỗ của bạn tại ${newBooking.slot?.code}`,
        data: { bookingId: newBooking.id },
      });

      return newBooking;
    } catch (err) {
      setError(err as Error);
      console.error('Error creating booking:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await bookingService.cancelBooking(id);
      
      setBookings(prev =>
        prev.map(booking =>
          booking.id === id
            ? { ...booking, status: BookingStatus.CANCELLED }
            : booking
        )
      );

      if (activeBooking?.id === id) {
        setActiveBooking(null);
      }

      addNotification({
        type: NotificationType.SYSTEM,
        title: 'Đã hủy đặt chỗ',
        message: 'Đặt chỗ của bạn đã được hủy thành công',
      });
    } catch (err) {
      setError(err as Error);
      console.error('Error canceling booking:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking, addNotification]);

  const getActiveBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await bookingService.getActiveBooking();
      setActiveBooking(response.data);
      return response.data;
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