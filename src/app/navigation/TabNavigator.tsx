import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../shared/constants/colors';
import { TabParamList } from '../../types/navigation.types';

// Screens
import HomeScreen from '../../features/home/screens/HomeScreen';
import SearchScreen from '../../features/search/screens/SearchScreen';
import BookingScreen from '../../features/booking/screens/BookingScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type TabRouteName = keyof TabParamList;

const TAB_CONFIG: Record<
  TabRouteName,
  { label: string; activeIcon: string; inactiveIcon: string }
> = {
  Home: {
    label: 'Trang chủ',
    activeIcon: 'home',
    inactiveIcon: 'home',
  },
  Search: {
    label: 'Tìm kiếm',
    activeIcon: 'search',
    inactiveIcon: 'search-outline',
  },
  Booking: {
    label: 'Đặt lịch',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  Profile: {
    label: 'Cài đặt',
    activeIcon: 'settings',
    inactiveIcon: 'settings',
  },
};

const renderTabIcon = (routeName: TabRouteName, focused: boolean) => {
  const tabConfig = TAB_CONFIG[routeName];

  return (
    <View style={styles.tabItemContent}>
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Icon
          name={focused ? tabConfig.activeIcon : tabConfig.inactiveIcon}
          size={24}
          color={focused ? COLORS.accent : COLORS.black}
        />
      </View>
      <Text numberOfLines={1} style={[styles.tabLabel, !focused && styles.hiddenLabel]}>{tabConfig.label}</Text>
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ focused }: { focused: boolean }) =>
          renderTabIcon(route.name as TabRouteName, focused),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Booking"
        component={BookingScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Booking', {
              resetToken: Date.now().toString(),
            });
          },
        })}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    height: Platform.OS === 'ios' ? 96 : 88,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    paddingTop: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    position: 'absolute',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    justifyContent: 'flex-start',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#D8D8D8',
  },
  tabLabel: {
    textAlign: 'center',
    minWidth: 60,
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenLabel: {
    opacity: 0,
    height: 0,
  },
});
