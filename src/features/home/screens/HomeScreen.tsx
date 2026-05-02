import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/colors';
import { parkingService } from '../../parking-map/services/parkingService';
import { ParkingMapDTO } from '../../../types/parking.types';
import { SPACING } from '../../../shared/constants/spacing';
import { useNotifications } from '../../../store/NotificationContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<any>;

const PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1000';

const extractParkingLots = (rawResponse: unknown): ParkingMapDTO[] => {
  const payload =
    (rawResponse as { data?: unknown })?.data ??
    (rawResponse as { items?: unknown })?.items ??
    (rawResponse as { parkingMaps?: unknown })?.parkingMaps ??
    rawResponse;

  if (Array.isArray(payload)) {
    return payload.filter(Boolean) as ParkingMapDTO[];
  }

  return payload ? [payload as ParkingMapDTO] : [];
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [parkingLots, setParkingLots] = useState<ParkingMapDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useNotifications();

  const featuredParkingLot = parkingLots[0] ?? null;

  const fetchParkingLots = useCallback(async () => {
    try {
      const response = await parkingService.getParkingMap();
      const lotList = extractParkingLots(response?.data);
      const uniqueLots = lotList.reduce((acc: ParkingMapDTO[], current) => {
        const lotCode = current?.code?.trim();
        if (!lotCode) {
          return acc;
        }

        const isDuplicate = acc.some(item => item.code === lotCode);
        if (!isDuplicate) {
          acc.push({
            ...current,
            code: lotCode,
            floors: Array.isArray(current.floors) ? current.floors : [],
          });
        }

        return acc;
      }, []);

      setParkingLots(uniqueLots);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setParkingLots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingLots();
  }, [fetchParkingLots]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParkingLots();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery });
    }
  };

  const calculateLotStats = (lot: ParkingMapDTO) => {
    let total = 0;
    let available = 0;
    let occupied = 0;

    lot.floors?.forEach(floor => {
      floor.zones?.forEach(zone => {
        zone.groupSlots?.forEach(groupSlot => {
          groupSlot.slots?.forEach(slot => {
            total++;
            if (slot.sensorStatus === true || slot.status === 2) {
              occupied++;
            } else if (slot.status === 0 || slot.sensorStatus === false) {
              available++;
            }
          });
        });
      });
    });

    if (total === 0) {
      lot.floors?.forEach(floor => {
        floor.zones?.forEach(zone => {
          zone.groupSlots?.forEach(groupSlot => {
            total += groupSlot.slots?.length || 0;
            available += groupSlot.availableSlots || 0;
            occupied += groupSlot.occupiedSlots || 0;
          });
        });
      });
    }

    return { total, available, occupied };
  };

  const featuredStats = featuredParkingLot
    ? calculateLotStats(featuredParkingLot)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.locationGroup}>
            <View style={styles.locationIconContainer}>
              <Icon name="location" size={20} color="#FF9500" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Vị trí của bạn</Text>
              <Text style={styles.locationValue}>Gò Vấp, Hồ Chí Minh</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications" size={24} color="#FF9500" />
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Tìm kiếm bãi giữ xe{'\n'}tốt nhất</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chỗ để xe trống"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch}>
            <Icon name="locate-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bãi đỗ xe</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 20 }}
          />
        ) : featuredParkingLot && featuredStats ? (
          <TouchableOpacity
            key={featuredParkingLot.code || featuredParkingLot._id}
            style={styles.parkingCard}
            activeOpacity={0.95}
            onPress={() =>
              navigation.navigate('ParkingMap', {
                parkingCode: featuredParkingLot.code,
              })
            }
          >
            <ImageBackground
              source={{ uri: PARKING_IMAGE }}
              style={styles.cardImage}
              imageStyle={styles.cardInternalImage}
            >
              <View style={styles.cardOverlay}>
                <Text style={styles.parkingName}>{featuredParkingLot.name}</Text>
                <Text style={styles.parkingLocation}>
                  {featuredParkingLot.location}
                </Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>
                    Tổng vị trí: {featuredStats.total} --
                  </Text>
                  <Text style={styles.statText}>
                    Vị trí đã đỗ: {featuredStats.occupied}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy bãi đỗ xe nào</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  locationTextContainer: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  heroSection: {
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#333333',
    borderRadius: 24,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
    height: 60,
  },
  searchPlaceholder: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  parkingCard: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardInternalImage: {
    borderRadius: 24,
  },
  cardOverlay: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  parkingName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  parkingLocation: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default HomeScreen;
