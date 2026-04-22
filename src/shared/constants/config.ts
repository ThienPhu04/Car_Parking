import { NativeModules, Platform } from 'react-native';

const resolveDevHost = () => {
  const bundleUrl = NativeModules.SourceCode?.scriptURL;

  if (typeof bundleUrl === 'string') {
    const match = bundleUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?/i);
    const host = match?.[1];

    if (host) {
      if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
        return '10.0.2.2';
      }

      return host;
    }
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

const DEV_HOST = resolveDevHost();
const DEV_API_BASE_URL = `http://${DEV_HOST}:3000/`;
const DEV_MQTT_BROKER_URL = `mqtt://${DEV_HOST}:1883`;
const PROD_API_BASE_URL = 'https://be-smartparking.onrender.com/';

export const CONFIG = {
  // API Configuration
  API_BASE_URL: __DEV__
    ? DEV_API_BASE_URL
    : PROD_API_BASE_URL,
  API_TIMEOUT: 30000, // 30 seconds
  
  // MQTT Configuration
  MQTT_BROKER_URL: __DEV__
    ? DEV_MQTT_BROKER_URL
    : 'mqtt://broker.smartparking.com:1883',
  MQTT_USERNAME: 'smartparking',
  MQTT_PASSWORD: 'secure_password',
  MQTT_RECONNECT_PERIOD: 5000,
  MQTT_CONNECT_TIMEOUT: 30000,
  
  // Booking Configuration
  BOOKING_TIMEOUT_MINUTES: 15,
  BOOKING_REMINDER_MINUTES: 5,
  MAX_BOOKING_DURATION_HOURS: 24,
  MIN_BOOKING_DURATION_MINUTES: 30,
  
  // Map Configuration
  INITIAL_REGION: {
    latitude: 20.9817,
    longitude: 105.9571,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  
  // Slot Configuration
  SLOT_SIZE: 60, // pixels
  SLOT_SPACING: 10, // pixels
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Cache
  CACHE_EXPIRY_HOURS: 24,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@smartparking:auth_token',
    REFRESH_TOKEN: '@smartparking:refresh_token',
    USER_DATA: '@smartparking:user_data',
    GUEST_VEHICLES: '@smartparking:guest_vehicles',
    GUEST_WALLET: '@smartparking:guest_wallet',
    GUEST_WALLET_HISTORY: '@smartparking:guest_wallet_history',
    CAR_LOCATION: '@smartparking:car_location',
    LANGUAGE: '@smartparking:language',
    THEME: '@smartparking:theme',
  },
} as const;
