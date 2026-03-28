import { NavigatorScreenParams } from '@react-navigation/native';
import { Booking } from './booking.types';

export interface BookingRouteParams {
  slotId?: string;
  vehicleId?: string;
  expectedArrivalTime?: string;
  expectedLeaveTime?: string;
  resetToken?: string;
}

export interface ParkingMapRouteParams {
  floor?: number;
  selectedSlot?: string;
  vehicleId?: string;
  expectedArrivalTime?: string;
  expectedLeaveTime?: string;
}

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { phone: string };
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  ParkingMap: ParkingMapRouteParams | undefined;
  BookingConfirm: { bookingId: string; booking?: Booking };
  MyBookings: undefined;
  FindCar: undefined;
  Notifications: undefined;
  VehicleManagement: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Booking: BookingRouteParams | undefined;
  Profile: undefined;
};

export interface PathNode {
  x: number;
  y: number;
}

export interface NavigationPath {
  path: PathNode[];
  distance: number; // meters
  estimatedTime: number; // seconds
}
