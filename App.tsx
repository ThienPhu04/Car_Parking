import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { AuthProvider } from './src/store/AuthContext';
import { ParkingProvider } from './src/store/ParkingContext';
import { NotificationProvider } from './src/store/NotificationContext';
import { mqttService } from './src/services/mqtt/mqttClient';
import { COLORS } from './src/shared/constants/colors';

const App: React.FC = () => {
  // useEffect(() => {
  //   initializeMQTT();

  //   return () => {
  //     mqttService.disconnect();
  //   };
  // }, []);

  // const initializeMQTT = async () => {
  //   try {
  //     await mqttService.connect();
  //     console.log('✅ MQTT Service initialized');
  //   } catch (error) {
  //     console.error('❌ Failed to initialize MQTT:', error);
  //   }
  // };

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <AuthProvider>
        <NotificationProvider>
          <ParkingProvider lotId="lot_001">
            <AppNavigator />
          </ParkingProvider>
        </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
