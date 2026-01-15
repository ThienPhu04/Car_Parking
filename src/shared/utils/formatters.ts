import { format, formatDistance, formatRelative } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatters = {
  date(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
    try {
      return format(new Date(date), formatStr, { locale: vi });
    } catch (error) {
      console.error('Date format error:', error);
      return '';
    }
  },

  time(date: string | Date, formatStr: string = 'HH:mm'): string {
    try {
      return format(new Date(date), formatStr, { locale: vi });
    } catch (error) {
      console.error('Time format error:', error);
      return '';
    }
  },

  dateTime(date: string | Date): string {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      console.error('DateTime format error:', error);
      return '';
    }
  },

  relativeTime(date: string | Date): string {
    try {
      return formatRelative(new Date(date), new Date(), { locale: vi });
    } catch (error) {
      console.error('Relative time format error:', error);
      return '';
    }
  },

  distance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  },

  duration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
  },

  currency(amount: number, currency: string = 'VND'): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  phone(phone: string): string {
    // Format: 0xxx xxx xxx
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  },

  percentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  },
};