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
  userId: string;
  slotId: string;
  slot?: ParkingSlot;
  vehicleId: string;
  vehicle?: Vehicle;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  qrCode?: string;
}

export interface CreateBookingRequest {
  slotId: string;
  vehicleId: string;
  startTime: string;
  duration: number; // minutes
}