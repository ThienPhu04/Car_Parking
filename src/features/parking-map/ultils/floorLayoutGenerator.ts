import {
  FloorLayout,
  FloorDTO,
  SlotDTO,
  SlotStatus,
  ParkingCell,
  CellType,
  ParkingSlot,
  EntryPoint,
  ExitPoint,
  SlotFeature,
} from '@app-types/parking.types';

/**
 * Generator for mock floor layout during development/testing.
 * Keeps behavior aligned with ParkingMapTransformer.
 */
export class FloorLayoutGenerator {
  /**
   * Generate mock floor layout.
   */
  static generateMockFloorLayout(floorLevel: number): FloorLayout {
    const mockFloorDTO: FloorDTO = {
      code: `MOCK-F${floorLevel}`,
      name: `Tang ${floorLevel}`,
      nameFloor: `Tang ${floorLevel}`,
      level: floorLevel,
      totalSlots: 30,
      entrances: 2,
      exits: 2,
      availableSlots: 15,
      occupiedSlots: 10,
      reservedSlots: 5,
      status: 1,
      statusName: 'Hoat dong',
      slots: this.generateMockSlots(floorLevel),
    };

    return this.generateFloorLayout(mockFloorDTO, 'MOCK');
  }

  /**
   * Generate mock slots.
   */
  private static generateMockSlots(floorLevel: number): SlotDTO[] {
    const slots: SlotDTO[] = [];
    let slotIndex = 1;

    // Left side slots
    for (let y = 3; y < 18; y += 2) {
      for (let x = 1; x <= 3; x++) {
        const status = this.randomStatus();
        slots.push({
          code: `MOCK-F${floorLevel}-L${slotIndex}`,
          nameSlot: `Vi tri L${slotIndex}`,
          x,
          y,
          status,
          statusName: this.getStatusName(status),
          zone: 'Khu A',
        });
        slotIndex++;
      }
    }

    slotIndex = 1;

    // Right side slots
    for (let y = 3; y < 18; y += 2) {
      for (let x = 8; x <= 10; x++) {
        const status = this.randomStatus();
        slots.push({
          code: `MOCK-F${floorLevel}-R${slotIndex}`,
          nameSlot: `Vi tri R${slotIndex}`,
          x,
          y,
          status,
          statusName: this.getStatusName(status),
          zone: 'Khu B',
        });
        slotIndex++;
      }
    }

    return slots;
  }

  private static randomStatus(): SlotStatus {
    const rand = Math.random();
    if (rand > 0.7) return SlotStatus.AVAILABLE;
    if (rand > 0.4) return SlotStatus.OCCUPIED;
    return SlotStatus.RESERVED;
  }

  private static getStatusName(status: SlotStatus): string {
    switch (status) {
      case SlotStatus.AVAILABLE:
        return 'Trong';
      case SlotStatus.RESERVED:
        return 'Da dat';
      case SlotStatus.OCCUPIED:
        return 'Da co xe';
      default:
        return 'Khong xac dinh';
    }
  }

  private static getFloorName(floorDto: FloorDTO): string {
    return floorDto.nameFloor || floorDto.name || `Tang ${floorDto.level}`;
  }

  /**
   * Supports both old shape (floor.slots) and new shape (floor.zones[].slots).
   */
  private static extractSlotsFromFloor(floorDto: FloorDTO): SlotDTO[] {
    if (Array.isArray(floorDto.slots)) {
      return floorDto.slots;
    }

    if (!Array.isArray(floorDto.zones)) {
      return [];
    }

    return floorDto.zones.flatMap(zone => {
      if (!Array.isArray(zone.slots)) {
        return [];
      }

      return zone.slots.map(slot => ({
        ...slot,
        zone: slot.zone || zone.nameZone,
        nameZone: slot.nameZone || zone.nameZone,
      }));
    });
  }

  /**
   * Generate FloorLayout from FloorDTO.
   */
  static generateFloorLayout(floorDto: FloorDTO, parkingCode: string): FloorLayout {
    const slotDtos = this.extractSlotsFromFloor(floorDto);
    const { width, height } = this.calculateGridSize(slotDtos);

    const cells: ParkingCell[][] = Array(height)
      .fill(null)
      .map(() =>
        Array(width)
          .fill(null)
          .map(() => ({
            type: CellType.WALL,
            walkable: false,
          }))
      );

    const slots = slotDtos.map(slotDto => this.transformSlot(slotDto, floorDto));

    slots.forEach(slot => {
      if (slot.y >= 0 && slot.y < height && slot.x >= 0 && slot.x < width) {
        cells[slot.y][slot.x] = slot;
      }
    });

    this.generateRoads(cells, width, height, slots);

    const entries = this.generateEntries(floorDto, width, height);
    const exits = this.generateExits(floorDto, width, height);

    entries.forEach(entry => {
      if (entry.y >= 0 && entry.y < height && entry.x >= 0 && entry.x < width) {
        cells[entry.y][entry.x] = entry;
      }
    });

    exits.forEach(exit => {
      if (exit.y >= 0 && exit.y < height && exit.x >= 0 && exit.x < width) {
        cells[exit.y][exit.x] = exit;
      }
    });

    return {
      floorId: floorDto.code,
      floorLevel: floorDto.level,
      floorName: this.getFloorName(floorDto),
      width,
      height,
      cells,
      slots,
      entries,
      exits,
    };
  }

  /**
   * Transform SlotDTO to ParkingSlot.
   */
  private static transformSlot(dto: SlotDTO, floorDto: FloorDTO): ParkingSlot {
    return {
      id: dto.code,
      code: dto.code,
      name: dto.nameSlot,
      floorId: floorDto.code,
      floorLevel: floorDto.level,
      zone: dto.zone || dto.nameZone || 'Khong xac dinh',
      x: dto.x,
      y: dto.y,
      status: dto.status as SlotStatus,
      statusName: dto.statusName,
      isActive: dto.isActive,
      isSensorReal: dto.isSensorReal,
      sensorId: dto.sensorId,
      type: CellType.SLOT,
      walkable: false,
      features: this.detectSlotFeatures(dto),
    };
  }

  /**
   * Detect slot features based on position.
   */
  private static detectSlotFeatures(slot: SlotDTO): SlotFeature[] {
    const features: SlotFeature[] = [];

    if (slot.x <= 1 || slot.x >= 10) {
      features.push('near_elevator');
    }

    if (slot.y >= 18) {
      features.push('near_exit');
    }

    return features;
  }

  /**
   * Calculate grid size from slots.
   */
  private static calculateGridSize(slots?: SlotDTO[]): { width: number; height: number } {
    if (!Array.isArray(slots) || slots.length === 0) {
      return { width: 12, height: 20 };
    }

    const maxX = Math.max(...slots.map(s => s.x), 11);
    const maxY = Math.max(...slots.map(s => s.y), 19);

    return {
      width: Math.max(maxX + 2, 12),
      height: Math.max(maxY + 2, 20),
    };
  }

  /**
   * Generate roads connecting slots.
   */
  private static generateRoads(
    cells: ParkingCell[][],
    width: number,
    height: number,
    slots: ParkingSlot[]
  ): void {
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

    for (let y = 2; y < height; y += 4) {
      for (let x = 0; x < width; x++) {
        if (cells[y][x].type === CellType.WALL) {
          cells[y][x] = { type: CellType.ROAD, walkable: true };
        }
      }
    }

    slots.forEach(slot => {
      this.ensureRoadToSlot(cells, slot, width, height);
    });
  }

  /**
   * Ensure there is a road adjacent to slot.
   */
  private static ensureRoadToSlot(
    cells: ParkingCell[][],
    slot: ParkingSlot,
    width: number,
    height: number
  ): void {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

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

    if (!hasAdjacentRoad) {
      const belowY = slot.y + 1;
      if (belowY < height && cells[belowY][slot.x].type === CellType.WALL) {
        cells[belowY][slot.x] = { type: CellType.ROAD, walkable: true };
      }
    }
  }

  /**
   * Generate entry points.
   */
  private static generateEntries(
    floorDto: FloorDTO,
    width: number,
    height: number
  ): EntryPoint[] {
    const entries: EntryPoint[] = [];
    const centerCol1 = Math.floor(width / 2) - 1;
    const centerCol2 = Math.floor(width / 2);

    const numEntries = Math.min(floorDto.entrances || 2, 2);

    if (numEntries >= 1) {
      entries.push({
        id: `${floorDto.code}-ENTRY-A`,
        name: `Loi vao ${floorDto.level}A`,
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
        name: `Loi vao ${floorDto.level}B`,
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
   * Generate exit points.
   */
  private static generateExits(
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
        name: `Loi ra ${floorDto.level}A`,
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
        name: `Loi ra ${floorDto.level}B`,
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
}

/**
 * Compatibility function.
 */
export const generateFloorLayout = (floorLevel: number): FloorLayout => {
  return FloorLayoutGenerator.generateMockFloorLayout(floorLevel);
};
