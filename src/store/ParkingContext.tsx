import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ParkingSlot, Floor } from '../types/parking.types';
import { mqttService } from '../services/mqtt/mqttClient';
import { SlotUpdateMessage } from '../types/mqtt.types';
import { MQTT_TOPICS } from '../shared/constants/mqttTopics';
import { ENDPOINTS } from '@shared/constants/endpoints';
import { apiClient } from '@services/api/apiClient';

interface ParkingContextType {
  slots: ParkingSlot[];
  selectedFloor: number;
  selectedSlot: ParkingSlot | null;
  floors: Floor[];
  isConnected: boolean;
  setSelectedFloor: (floor: number) => void;
  setSelectedSlot: (slot: ParkingSlot | null) => void;
  updateSlotStatus: (slotId: string, status: any) => void;
  refreshSlots: () => Promise<void>;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode; lotId: string }> = ({
  children,
  lotId,
}) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeMQTT();
    return () => {
      mqttService.disconnect();
    };
  }, [lotId]);

  useEffect(() => {
    if (isConnected) {
      subscribeToFloor(selectedFloor);
    }
  }, [selectedFloor, isConnected]);

  const initializeMQTT = async () => {
    try {
      await mqttService.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('MQTT connection error:', error);
      setIsConnected(false);
    }
  };

  const subscribeToFloor = (floor: number) => {
    const topic = MQTT_TOPICS.SLOT_STATUS(lotId, floor);

    const unsubscribe = mqttService.subscribe(topic, (message: SlotUpdateMessage) => {
      updateSlotStatus(message.slotId, message.status);
    });

    return unsubscribe;
  };

  const updateSlotStatus = (slotId: string, status: any) => {
    setSlots((prevSlots) =>
      prevSlots.map((slot) =>
        slot.id === slotId ? { ...slot, status } : slot
      )
    );
  };

  const refreshSlots = async () => {
    // TODO: Fetch slots from API
    try {
      const response = await apiClient.get<ParkingSlot[]>(ENDPOINTS.GET_MAP);
      console.log('API car parking response:', response);
      // const response = await apiClient.get(ENDPOINTS.GET_SLOTS(lotId, selectedFloor));
      // setSlots(response.data);
    } catch (error) {
      console.error('Error refreshing slots:', error);
    }
  };

  const value: ParkingContextType = {
    slots,
    selectedFloor,
    selectedSlot,
    floors,
    isConnected,
    setSelectedFloor,
    setSelectedSlot,
    updateSlotStatus,
    refreshSlots,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within ParkingProvider');
  }
  return context;
};
