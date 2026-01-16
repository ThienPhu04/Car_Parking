import React from 'react';
// import { useAuth } from '../../store/AuthContext';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from '../../types/navigation.types';

// Auth Screens
// import LoginScreen from '../../features/auth/screens/LoginScreen';
// import RegisterScreen from '../../features/auth/screens/RegisterScreen';
// import OTPVerificationScreen from '../../features/auth/screens/OTPVerificationScreen';

// Main Navigation
import { TabNavigator } from './TabNavigator';

// Additional Main Screens
import ParkingMapScreen from '../../features/parking-map/screens/ParkingMapScreen';
import BookingConfirmScreen from '../../features/booking/screens/BookingConfirmScreen';
import FindCarScreen from '../../features/find-car/screens/FindCarScreen';
import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen';
import VehicleManagementScreen from '../../features/profile/screens/VehicleManagementScreen';

// Components
import { Loading } from '../../shared/components/Loading';
import { COLORS } from '../../shared/constants/colors';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();


// const AuthNavigator: React.FC = () => {
//   return (
//     <AuthStack.Navigator
//       screenOptions={{
//         headerShown: false,
//         animation: 'fade',
//         contentStyle: { backgroundColor: COLORS.background },
//       }}
//     >
//       <AuthStack.Screen name="Login" component={LoginScreen} />
//       <AuthStack.Screen name="Register" component={RegisterScreen} />
//       <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
//     </AuthStack.Navigator>
//   );
// };

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
          title: 'Bản đồ bãi đỗ',
          headerBackTitle: 'Quay lại',
        }}
      />
      <MainStack.Screen
        name="BookingConfirm"
        component={BookingConfirmScreen}
        options={{
          title: 'Xác nhận đặt chỗ',
          headerBackTitle: 'Quay lại',
        }}
      />
      <MainStack.Screen
        name="FindCar"
        component={FindCarScreen}
        options={{
          title: 'Tìm xe của tôi',
          headerBackTitle: 'Quay lại',
        }}
      />
      <MainStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Thông báo',
          headerBackTitle: 'Quay lại',
        }}
      />
      <MainStack.Screen
        name="VehicleManagement"
        component={VehicleManagementScreen}
        options={{
          title: 'Quản lý xe',
          headerBackTitle: 'Quay lại',
        }}
      />
    </MainStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  // const { isAuthenticated, isLoading } = useAuth();


  // if (isLoading) {
  //   return <Loading fullscreen text="Đang tải..." />;
  // }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )} */}
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Export default
export default AppNavigator;