import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

export const DIMENSIONS = {
  WINDOW_WIDTH: width,
  WINDOW_HEIGHT: height,
  IS_SMALL_DEVICE: width < 375,
  IS_IPHONE_X: Platform.OS === 'ios' && (height === 812 || height === 896),
  STATUS_BAR_HEIGHT: Platform.select({
    ios: 44,
    android: StatusBar.currentHeight || 0,
    default: 0,
  }),
  HEADER_HEIGHT: Platform.select({
    ios: 44,
    android: 56,
    default: 64,
  }),
  TAB_BAR_HEIGHT: 60,
  SAFE_AREA_PADDING: {
    top: Platform.select({ ios: 44, default: 0 }),
    bottom: Platform.select({ ios: 34, default: 0 }),
  },
} as const;