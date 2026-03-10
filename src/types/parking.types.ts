// ─── STATUS ENUMS ─────────────────────────────────────────────────────────────

export enum SlotStatus {
  AVAILABLE = 0,
  RESERVED  = 1,
  OCCUPIED  = 2,
}

export enum CellType {
  SLOT  = 'slot',
  ROAD  = 'road',
  WALL  = 'wall',
  ZONE  = 'zone',
  ENTRY = 'entry',
  EXIT  = 'exit',
  LANE  = 'lane',
  ELEVATOR = 'elevator',
  STAIRS = 'stairs',
}

export interface Position { x: number; y: number; }
export interface ParkingCell { type: CellType; walkable: boolean; }
export interface ZoneCell extends ParkingCell {
  type: CellType.ZONE;
  zoneCode: string;
  zoneName: string;
}

export type SlotFeature = 'near_elevator' | 'near_exit' | 'covered' | 'ev_charging';

export interface ParkingSlot extends ParkingCell {
  id: string;
  code: string;
  name: string;
  floorId: string;
  floorLevel: number;
  zone: string;
  x: number;   // grid index (đã convert từ canvas pixel)
  y: number;   // grid index (đã convert từ canvas pixel)
  status: SlotStatus;
  statusName: string;
  isActive?: boolean;
  isSensorReal?: boolean;
  sensorId?: string;
  features?: SlotFeature[];
}

export interface EntryPoint extends ParkingCell {
  id: string; name: string;
  floorId: string; floorLevel: number;
  x: number; y: number;
}

export interface ExitPoint extends ParkingCell {
  id: string; name: string;
  floorId: string; floorLevel: number;
  x: number; y: number;
}

export interface Floor {
  id: string; code: string; name: string; level: number;
  totalSlots: number; availableSlots: number;
  occupiedSlots: number; reservedSlots: number;
  entrances: number; exits: number;
  status: number; statusName: string; totalZones?: number;
}

export interface FloorLayout {
  floorId: string; floorLevel: number; floorName: string;
  width: number; height: number;
  cells: ParkingCell[][];
  slots: ParkingSlot[];
  entries: EntryPoint[];
  exits: ExitPoint[];
  zones?: ZoneLayout[];
}

export interface ZoneLayout {
  code: string;
  name: string;
  points: Position[];
}

export interface ParkingMap {
  code: string; name: string; location: string;
  status: number; statusName: string; totalFloors: number;
  floors: Floor[]; layouts: FloorLayout[];
}

export interface NavigationRoute {
  path: Position[]; distance: number; estimatedTime: number;
  instructions: NavigationInstruction[];
}
export interface NavigationInstruction {
  position: Position; direction: 'straight' | 'left' | 'right'; description: string;
}

// ─── DTOs — khớp đúng response thực tế từ API ────────────────────────────────
//
// Response shape (đã xác nhận từ log):
//   parking { floors[] { entrances[], exits[], lanes[], zones[] { groupSlots[] { slots[] } } } }
//
// Tất cả các mảng con đã được POPULATE và nhúng trực tiếp trong response.
// Tọa độ là canvas pixel (có thể âm) → cần normalize trước khi dùng làm grid index.

export interface ParkingMapDTO {
  _id?: string;
  code: string; name: string; location: string;
  status: number; statusName: string; totalFloors: number;
  floors: FloorDTO[];
}

export type ParkingMapResponseDTO = ParkingMapDTO | ParkingMapDTO[];

export interface FloorDTO {
  _id?: string;
  code: string;
  nameFloor: string;
  level: number;
  status: number;
  statusName: string;
  boundary?: {
    points: number[];   // polygon [x0,y0, x1,y1, ...] — canvas pixel
    closed: boolean;
  };
  entrances: EntranceDTO[];   // đã populate từ Entrance collection
  exits:     ExitDTO[];       // đã populate từ Exit collection
  lanes:     LaneDTO[];       // đã populate từ Lane collection
  slotStandalone: any[];
  zones: ZoneDTO[];
}

export interface EntranceDTO {
  _id?: string;
  code: string;
  positionX: number;   // canvas pixel (có thể âm)
  positionY: number;
  height: number;
  witdh: number;       // typo trong model — giữ nguyên
  rotation: number;
  status: number;
  statusName: string;
}

export interface ExitDTO {
  _id?: string;
  code: string;
  positionX: number;   // canvas pixel (có thể âm)
  positionY: number;
  height: number;
  witdh: number;
  rotation: number;
  status: number;
  statusName: string;
}

export interface LaneDTO {
  _id?: string;
  code: string;
  positionX: number;
  positionY: number;
  height: number;
  witdh: number;
  rotation: number;
  status: number;
  statusName: string;
}

export interface ZoneDTO {
  _id?: string;
  code: string;
  nameZone: string;
  color: string;
  status: number;
  statusName: string;
  points: number[];       // polygon [x0,y0, x1,y1, ...] — canvas pixel
  groupSlots: GroupSlotDTO[];
}

export interface GroupSlotDTO {
  _id?: string;
  code: string;
  nameGroupSlot: string;
  positionX: number;      // canvas pixel — tọa độ của cả dãy slot
  positionY: number;
  rotation: number;
  direction: string;      // 'horizontal' | 'vertical'
  height: number;
  width: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  status: number;
  slots: RawSlotDTO[];
}

export interface RawSlotDTO {
  _id?: string;
  code: string;
  nameSlot: string;
  groupSlotCode: string;
  status: number;         // trạng thái record slot (vd: chỉnh sửa/hoạt động), không dùng cho trạng thái đỗ xe
  statusName: string;
  isSensorReal: boolean;
  sensorId: string | null;
  isActive: boolean;
  sensorStatus?: boolean; // trạng thái đỗ xe: true=có xe, false=trống
  // Không có positionX/Y (bị comment out trong Slot.model)
  // Tọa độ render lấy từ GroupSlot.positionX/Y
}
