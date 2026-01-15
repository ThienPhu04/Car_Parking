import { NavigatorScreenParams } from '@react-navigation/native';

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
  ParkingMap: { floor?: number };
  BookingConfirm: { bookingId: string };
  FindCar: undefined;
  Notifications: undefined;
  VehicleManagement: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Booking: undefined;
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