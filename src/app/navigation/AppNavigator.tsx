import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../../store/AuthContext';
import { Loading } from '../../shared/components/Loading';
import { COLORS } from '../../shared/constants/colors';
import {
  AuthStackParamList,
  MainStackParamList,
  RootStackParamList,
} from '../../types/navigation.types';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import OTPVerificationScreen from '../../features/auth/screens/OTPVerificationScreen';
import BookingConfirmScreen from '../../features/booking/screens/BookingConfirmScreen';
import MyBookingsScreen from '../../features/booking/screens/MyBookingsScreen';
import FindCarScreen from '../../features/find-car/screens/FindCarScreen';
import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen';
import ParkingMapScreen from '../../features/parking-map/screens/ParkingMapScreen';
import VehicleManagementScreen from '../../features/profile/screens/VehicleManagementScreen';
import { TabNavigator } from './TabNavigator';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </AuthStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: COLORS.backgroundSecondary,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="ParkingMap"
        component={ParkingMapScreen}
        options={{
          title: 'Ban do bai do',
          headerBackTitle: 'Quay lai',
        }}
      />
      <MainStack.Screen
        name="BookingConfirm"
        component={BookingConfirmScreen}
        options={{
          title: 'Xac nhan dat cho',
          headerBackTitle: 'Quay lai',
        }}
      />
      <MainStack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          title: 'Lich su dat cho',
          headerBackTitle: 'Quay lai',
        }}
      />
      <MainStack.Screen
        name="FindCar"
        component={FindCarScreen}
        options={{
          title: 'Tim xe cua toi',
          headerBackTitle: 'Quay lai',
        }}
      />
      <MainStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Thong bao',
          headerBackTitle: 'Quay lai',
        }}
      />
      <MainStack.Screen
        name="VehicleManagement"
        component={VehicleManagementScreen}
        options={{
          title: 'Quan ly xe',
          headerBackTitle: 'Quay lai',
        }}
      />
    </MainStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullscreen text="Dang tai..." />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
