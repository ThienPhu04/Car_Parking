export enum SlotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

export interface Position {
  x: number;
  y: number;
}

export interface ParkingSlot {
  id: string;
  code: string; // A1, B2, C3
  floor: number;
  status: SlotStatus;
  position: Position;
  features?: SlotFeature[];
  reservedBy?: string;
  reservedUntil?: string;
}

export type SlotFeature = 
  | 'near_elevator' 
  | 'near_exit' 
  | 'covered' 
  | 'ev_charging'
  | 'disabled_friendly';

export interface Floor {
  id: number;
  name: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
}

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  floors: Floor[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}