export enum ParkingSessionStatus {
  ONGOING = 0,
  COMPLETED = 1,
}

export enum ParkingPaymentStatus {
  UNPAID = 0,
  PAID = 1,
}

export type ParkingSessionProcessType =
  | 'CHECKIN'
  | 'SUCCESS'
  | 'QR_REQUIRED'
  | 'ALREADY_PAID';

export interface ParkingSession {
  id: string;
  code?: string;
  userId?: string;
  status: ParkingSessionStatus;
  statusName?: string;
  paymentStatus: ParkingPaymentStatus;
  paymentStatusName?: string;
  price: number;
  checkInTime: string;
  checkOutTime?: string;
  createdAt?: string;
  updatedAt?: string;
  bookingCode?: string;
  slotCode?: string;
  slotName?: string;
  floorLabel?: string;
  plateNumber?: string;
  vehicleName?: string;
}

export interface ParkingSessionProcessPayload {
  plateNumber: string;
  capturedAt?: string;
  licensePlateId?: string;
}

export interface ParkingSessionPaymentQr {
  qr?: string;
  content?: string;
  amount?: number;
}

export interface ParkingSessionProcessResult {
  type: ParkingSessionProcessType;
  message?: string;
  session?: ParkingSession;
  paymentQr?: ParkingSessionPaymentQr;
}
