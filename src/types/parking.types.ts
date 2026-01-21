export enum SlotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

export enum CellType {
  SLOT = 'slot',           // Ô đỗ xe
  ROAD = 'road',           // Đường đi
  WALL = 'wall',           // Tường/chướng ngại vật
  ENTRY = 'entry',         // Lối vào
  EXIT = 'exit',           // Lối ra
  ELEVATOR = 'elevator',   // Thang máy
  STAIRS = 'stairs',       // Cầu thang
}

export interface Position {
  x: number;
  y: number;
}

export interface ParkingCell {
  x: number;
  y: number;
  type: CellType;
  walkable: boolean;
}

export interface ParkingSlot extends ParkingCell {
  id: string;
  code: string;
  floor: number;
  status: SlotStatus;
  features?: SlotFeature[];
  reservedBy?: string;
  reservedUntil?: string;
}

export interface EntryPoint extends ParkingCell {
  id: string;
  name: string;
  floor: number;
}

export interface ExitPoint extends ParkingCell {
  id: string;
  name: string;
  floor: number;
}

export interface FloorLayout {
  floor: number;
  width: number;
  height: number;
  cells: ParkingCell[][];
  slots: ParkingSlot[];
  entries: EntryPoint[];
  exits: ExitPoint[];
}

export interface NavigationRoute {
  path: Position[];
  distance: number;
  estimatedTime: number;
  instructions: NavigationInstruction[];
}

export interface NavigationInstruction {
  position: Position;
  direction: 'straight' | 'left' | 'right';
  description: string;
}
export type SlotFeature =
  | 'near_elevator'
  | 'near_exit'
  | 'covered'
  | 'ev_charging'
  | 'disabled_friendly';
