import {
  ParkingMapDTO,
  FloorDTO,
  SlotDTO,
  ParkingMap,
  Floor,
  FloorLayout,
  ParkingSlot,
  EntryPoint,
  ExitPoint,
  ParkingCell,
  CellType,
  SlotStatus,
  SlotFeature,
} from '../../../types/parking.types';

/**
 * Transform backend DTO sang app models
 */
export class ParkingMapTransformer {
  /**
   * Transform ParkingMapDTO -> ParkingMap
   */
  static transformParkingMap(dto: ParkingMapDTO): ParkingMap {
    const floors = dto.floors.map(floorDto => this.transformFloor(floorDto, dto.code));
    const layouts = dto.floors.map(floorDto => 
      this.generateFloorLayout(floorDto, dto.code)
    );

    return {
      code: dto.code,
      name: dto.name,
      location: dto.location,
      status: dto.status,
      statusName: dto.statusName,
      totalFloors: dto.totalFloors,
      floors,
      layouts,
    };
  }

  /**
   * Transform FloorDTO -> Floor
   */
  static transformFloor(dto: FloorDTO, parkingCode: string): Floor {
    return {
      id: dto.code,
      code: dto.code,
      name: dto.name,
      level: dto.level,
      totalSlots: dto.totalSlots,
      availableSlots: dto.availableSlots,
      occupiedSlots: dto.occupiedSlots,
      reservedSlots: dto.reservedSlots,
      entrances: dto.entrances,
      exits: dto.exits,
      status: dto.status,
      statusName: dto.statusName,
    };
  }

  /**
   * Transform SlotDTO -> ParkingSlot
   */
  static transformSlot(dto: SlotDTO, floorDto: FloorDTO): ParkingSlot {
    return {
      id: dto.code,
      code: dto.code,
      name: dto.nameSlot,
      floorId: floorDto.code,
      floorLevel: floorDto.level,
      zone: dto.zone,
      x: dto.x,
      y: dto.y,
      status: dto.status as SlotStatus,
      statusName: dto.statusName,
      type: CellType.SLOT,
      walkable: false,
      features: this.detectSlotFeatures(dto),
    };
  }

  /**
   * Detect features dựa trên vị trí
   */
  static detectSlotFeatures(slot: SlotDTO): SlotFeature[] {
    const features: SlotFeature[] = [];
    
    // Near elevator: x = 0 hoặc x gần edge
    if (slot.x <= 1 || slot.x >= 10) {
      features.push('near_elevator');
    }
    
    // Near exit: y gần cuối
    if (slot.y >= 18) {
      features.push('near_exit');
    }
    
    return features;
  }

  /**
   * Generate FloorLayout từ FloorDTO
   */
  static generateFloorLayout(floorDto: FloorDTO, parkingCode: string): FloorLayout {
    // Xác định kích thước grid dựa trên slots
    const { width, height } = this.calculateGridSize(floorDto.slots);
    
    // Khởi tạo grid với walls
    const cells: ParkingCell[][] = Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => ({
        type: CellType.WALL,
        walkable: false,
      }))
    );

    // Transform slots
    const slots = floorDto.slots.map(slotDto => 
      this.transformSlot(slotDto, floorDto)
    );

    // Đặt slots vào grid
    slots.forEach(slot => {
      if (slot.y < height && slot.x < width) {
        cells[slot.y][slot.x] = slot;
      }
    });

    // Generate đường đi (roads)
    this.generateRoads(cells, width, height, slots);

    // Generate entries & exits
    const entries = this.generateEntries(floorDto, width, height);
    const exits = this.generateExits(floorDto, width, height);

    // Đặt entries/exits vào grid
    entries.forEach(entry => {
      if (entry.y < height && entry.x < width) {
        cells[entry.y][entry.x] = entry;
      }
    });

    exits.forEach(exit => {
      if (exit.y < height && exit.x < width) {
        cells[exit.y][exit.x] = exit;
      }
    });

    return {
      floorId: floorDto.code,
      floorLevel: floorDto.level,
      floorName: floorDto.name,
      width,
      height,
      cells,
      slots,
      entries,
      exits,
    };
  }

  /**
   * Tính kích thước grid dựa trên slots
   */
  static calculateGridSize(slots: SlotDTO[]): { width: number; height: number } {
    if (slots.length === 0) {
      return { width: 12, height: 20 }; // Default size
    }

    const maxX = Math.max(...slots.map(s => s.x), 11);
    const maxY = Math.max(...slots.map(s => s.y), 19);

    return {
      width: Math.max(maxX + 2, 12),
      height: Math.max(maxY + 2, 20),
    };
  }

  /**
   * Generate roads dựa trên vị trí slots
   */
  static generateRoads(
    cells: ParkingCell[][],
    width: number,
    height: number,
    slots: ParkingSlot[]
  ): void {
    // Đường chính giữa (central road) - Cột 5 và 6
    const centerCol1 = Math.floor(width / 2) - 1;
    const centerCol2 = Math.floor(width / 2);

    for (let y = 0; y < height; y++) {
      if (cells[y][centerCol1].type === CellType.WALL) {
        cells[y][centerCol1] = { type: CellType.ROAD, walkable: true };
      }
      if (cells[y][centerCol2].type === CellType.WALL) {
        cells[y][centerCol2] = { type: CellType.ROAD, walkable: true };
      }
    }

    // Đường ngang (horizontal roads) - Mỗi 4 hàng
    for (let y = 2; y < height; y += 4) {
      for (let x = 0; x < width; x++) {
        if (cells[y][x].type === CellType.WALL) {
          cells[y][x] = { type: CellType.ROAD, walkable: true };
        }
      }
    }

    // Đảm bảo có đường đến mỗi slot
    slots.forEach(slot => {
      this.ensureRoadToSlot(cells, slot, width, height);
    });
  }

  /**
   * Đảm bảo có đường đi đến slot
   */
  static ensureRoadToSlot(
    cells: ParkingCell[][],
    slot: ParkingSlot,
    width: number,
    height: number
  ): void {
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
    ];

    // Check xung quanh slot, nếu không có road thì tạo
    let hasAdjacentRoad = false;
    
    for (const dir of directions) {
      const nx = slot.x + dir.dx;
      const ny = slot.y + dir.dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (cells[ny][nx].type === CellType.ROAD) {
          hasAdjacentRoad = true;
          break;
        }
      }
    }

    // Nếu chưa có road xung quanh, tạo road ở dưới
    if (!hasAdjacentRoad) {
      const belowY = slot.y + 1;
      if (belowY < height && cells[belowY][slot.x].type === CellType.WALL) {
        cells[belowY][slot.x] = { type: CellType.ROAD, walkable: true };
      }
    }
  }

  /**
   * Generate entry points
   */
  static generateEntries(
    floorDto: FloorDTO,
    width: number,
    height: number
  ): EntryPoint[] {
    const entries: EntryPoint[] = [];
    const centerCol1 = Math.floor(width / 2) - 1;
    const centerCol2 = Math.floor(width / 2);

    // Tạo số lượng entries theo backend
    const numEntries = Math.min(floorDto.entrances || 2, 2);

    if (numEntries >= 1) {
      entries.push({
        id: `${floorDto.code}-ENTRY-A`,
        name: `Lối vào ${floorDto.level}A`,
        floorId: floorDto.code,
        floorLevel: floorDto.level,
        x: centerCol1,
        y: 0,
        type: CellType.ENTRY,
        walkable: true,
      });
    }

    if (numEntries >= 2) {
      entries.push({
        id: `${floorDto.code}-ENTRY-B`,
        name: `Lối vào ${floorDto.level}B`,
        floorId: floorDto.code,
        floorLevel: floorDto.level,
        x: centerCol2,
        y: 0,
        type: CellType.ENTRY,
        walkable: true,
      });
    }

    return entries;
  }

  /**
   * Generate exit points
   */
  static generateExits(
    floorDto: FloorDTO,
    width: number,
    height: number
  ): ExitPoint[] {
    const exits: ExitPoint[] = [];
    const centerCol1 = Math.floor(width / 2) - 1;
    const centerCol2 = Math.floor(width / 2);

    const numExits = Math.min(floorDto.exits || 2, 2);

    if (numExits >= 1) {
      exits.push({
        id: `${floorDto.code}-EXIT-A`,
        name: `Lối ra ${floorDto.level}A`,
        floorId: floorDto.code,
        floorLevel: floorDto.level,
        x: centerCol1,
        y: height - 1,
        type: CellType.EXIT,
        walkable: true,
      });
    }

    if (numExits >= 2) {
      exits.push({
        id: `${floorDto.code}-EXIT-B`,
        name: `Lối ra ${floorDto.level}B`,
        floorId: floorDto.code,
        floorLevel: floorDto.level,
        x: centerCol2,
        y: height - 1,
        type: CellType.EXIT,
        walkable: true,
      });
    }

    return exits;
  }

  /**
   * Update slot status real-time
   */
  static updateSlotStatus(
    layout: FloorLayout,
    slotCode: string,
    newStatus: SlotStatus,
    newStatusName: string
  ): FloorLayout {
    const updatedSlots = layout.slots.map(slot =>
      slot.code === slotCode
        ? { ...slot, status: newStatus, statusName: newStatusName }
        : slot
    );

    // Update trong cells grid
    const updatedCells = layout.cells.map(row =>
      row.map(cell => {
        if (cell.type === CellType.SLOT) {
          const slotCell = cell as ParkingSlot;
          if (slotCell.code === slotCode) {
            return { ...slotCell, status: newStatus, statusName: newStatusName };
          }
        }
        return cell;
      })
    );

    return {
      ...layout,
      slots: updatedSlots,
      cells: updatedCells,
    };
  }
}