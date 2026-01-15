import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '@shared/constants/spacing';

interface CarLocationMapProps {
  latitude: number;
  longitude: number;
  slotCode: string;
  floor: number;
}

export const CarLocationMap: React.FC<CarLocationMapProps> = ({
  latitude,
  longitude,
  slotCode,
  floor,
}) => {
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={`Xe của bạn - ${slotCode}`}
          description={`Tầng ${floor}`}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker}>
              <Icon name="car" size={32} color={COLORS.primary} />
            </View>
          </View>
        </Marker>
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});