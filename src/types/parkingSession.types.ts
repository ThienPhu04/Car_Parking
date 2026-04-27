export enum ParkingSessionStatus {
  ONGOING = 0,
  COMPLETED = 1,
}

export enum ParkingPaymentStatus {
  UNPAID = 0,
  PAID = 1,
}

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
