export enum SlotStatus {
  AVAILABLE = 0,
  RESERVED = 1,
  OCCUPIED = 2,
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
  type: CellType;
  walkable: boolean;
}

export interface ParkingSlot extends ParkingCell {
  id: string;          // _id
  code: string;        // Slot.code
  name: string;        // nameSlot
  floorId: string;     // floorCode (ObjectId)
  floorLevel: number;  // lấy từ Floor.level
  zone: string;

  x: number; // new updated position
  y: number;

  status: SlotStatus;  // map trực tiếp từ number
  statusName: string;

  features?: SlotFeature[];
}


export interface EntryPoint extends ParkingCell {
  id: string;
  name: string;
  floorId: string;
  floorLevel: number;
  x: number; // new updated position
  y: number;
}


export interface ExitPoint extends ParkingCell {
  id: string;
  name: string;
  floorId: string;
  floorLevel: number;
  x: number; // new updated position
  y: number;
}


export interface Floor {
  id: string;           // _id
  code: string;
  name: string;
  level: number;

  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;

  entrances: number;
  exits: number;

  status: number;
  statusName: string;
}

export interface FloorLayout {
  floorId: string;
  floorLevel: number;
  floorName: string;

  width: number;
  height: number;

  cells: ParkingCell[][];

  slots: ParkingSlot[];
  entries: EntryPoint[];
  exits: ExitPoint[];
}

export interface ParkingMap {
  code: string;
  name: string;
  location: string;

  status: number;
  statusName: string;

  totalFloors: number;

  floors: Floor[];
  layouts: FloorLayout[];
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


  // DTO từ backend
export interface ParkingMapDTO {
  code: string;
  name: string;
  location: string;
  status: number;
  statusName: string;
  totalFloors: number;
  floors: FloorDTO[];
}

export interface FloorDTO {
  code: string;
  name: string;
  level: number;
  totalSlots: number;
  entrances: number;
  exits: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  status: number;
  statusName: string;
  slots: SlotDTO[];
}

export interface SlotDTO {
  code: string;
  nameSlot: string;
  x: number;
  y: number;
  status: number;
  statusName: string;
  zone: string;
}