import { ParkingSlot } from "./parking.types";
import { Vehicle } from "./vehicle.types";

export enum BookingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface Booking {
  id: string;
  code?: string;
  userId: string;
  slotId?: string;
  slot?: Partial<ParkingSlot>;
  vehicleId: string;
  vehicle?: Partial<Vehicle>;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  statusName?: string;
  licensePlate?: string;
  createdAt: string;
  qrCode?: string;
}

export interface CreateBookingRequest {
  vehicleId: string;
  expectedArrivalTime: string;
  status?: number;
}

export interface GetBookingsRequest {
  userId: string;
  status?: number | string;
  keyword?: string;
}
