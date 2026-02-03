import { FloorLayout, FloorDTO, SlotDTO, SlotStatus, ParkingCell, CellType, ParkingSlot, EntryPoint, ExitPoint , SlotFeature} from "@app-types/parking.types";

/**
 * Generator cho mock floor layout khi chưa có API
 * Sử dụng cùng logic với ParkingMapTransformer
 */
export class FloorLayoutGenerator {
  /**
   * Generate mock floor layout (for development/testing)
   */
  static generateMockFloorLayout(floorLevel: number): FloorLayout {
    const mockFloorDTO: FloorDTO = {
      code: `MOCK-F${floorLevel}`,
      name: `Tầng ${floorLevel}`,
      level: floorLevel,
      totalSlots: 30,
      entrances: 2,
      exits: 2,
      availableSlots: 15,
      occupiedSlots: 10,
      reservedSlots: 5,
      status: 1,
      statusName: 'Hoạt động',
      slots: this.generateMockSlots(floorLevel),
    };

    return this.generateFloorLayout(mockFloorDTO, 'MOCK');
  }

  /**
   * Generate mock slots
   */
  private static generateMockSlots(floorLevel: number): SlotDTO[] {
    const slots: SlotDTO[] = [];
    let slotIndex = 1;

    // Left side slots
    for (let y = 3; y < 18; y += 2) {
      for (let x = 1; x <= 3; x++) {
        slots.push({
          code: `MOCK-F${floorLevel}-L${slotIndex}`,
          nameSlot: `Vị trí L${slotIndex}`,
          x,
          y,
          status: this.randomStatus(),
          statusName: this.getStatusName(this.randomStatus()),
          zone: 'Khu A',
        });
        slotIndex++;
      }
    }

    slotIndex = 1;
    // Right side slots
    for (let y = 3; y < 18; y += 2) {
      for (let x = 8; x <= 10; x++) {
        slots.push({
          code: `MOCK-F${floorLevel}-R${slotIndex}`,
          nameSlot: `Vị trí R${slotIndex}`,
          x,
          y,
          status: this.randomStatus(),
          statusName: this.getStatusName(this.randomStatus()),
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
        return 'Trống';
      case SlotStatus.RESERVED:
        return 'Đã đặt';
      case SlotStatus.OCCUPIED:
        return 'Đã có xe';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Generate FloorLayout từ FloorDTO
   * (Duplicate logic from ParkingMapTransformer for standalone use)
   */
  static generateFloorLayout(floorDto: FloorDTO, parkingCode: string): FloorLayout {
    // Calculate grid size
    const { width, height } = this.calculateGridSize(floorDto.slots);

    // Initialize grid with walls
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

    // Transform slots
    const slots = floorDto.slots.map((slotDto) =>
      this.transformSlot(slotDto, floorDto)
    );

    // Place slots in grid
    slots.forEach((slot) => {
      if (slot.y < height && slot.x < width) {
        cells[slot.y][slot.x] = slot;
      }
    });

    // Generate roads
    this.generateRoads(cells, width, height, slots);

    // Generate entries & exits
    const entries = this.generateEntries(floorDto, width, height);
    const exits = this.generateExits(floorDto, width, height);

    // Place entries/exits in grid
    entries.forEach((entry) => {
      if (entry.y < height && entry.x < width) {
        cells[entry.y][entry.x] = entry;
      }
    });

    exits.forEach((exit) => {
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
   * Transform SlotDTO to ParkingSlot
   */
  private static transformSlot(dto: SlotDTO, floorDto: FloorDTO): ParkingSlot {
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
   * Detect slot features based on position
   */
  private static detectSlotFeatures(slot: SlotDTO): SlotFeature[] {
    const features: SlotFeature[] = [];

    // Near elevator: x <= 1 or x >= 10
    if (slot.x <= 1 || slot.x >= 10) {
      features.push('near_elevator');
    }

    // Near exit: y >= 18
    if (slot.y >= 18) {
      features.push('near_exit');
    }

    return features;
  }

  /**
   * Calculate grid size from slots
   */
  private static calculateGridSize(slots: SlotDTO[]): { width: number; height: number } {
    if (slots.length === 0) {
      return { width: 12, height: 20 };
    }

    const maxX = Math.max(...slots.map((s) => s.x), 11);
    const maxY = Math.max(...slots.map((s) => s.y), 19);

    return {
      width: Math.max(maxX + 2, 12),
      height: Math.max(maxY + 2, 20),
    };
  }

  /**
   * Generate roads connecting slots
   */
  private static generateRoads(
    cells: ParkingCell[][],
    width: number,
    height: number,
    slots: ParkingSlot[]
  ): void {
    // Central road - columns 5 and 6
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

    // Horizontal roads - every 4 rows
    for (let y = 2; y < height; y += 4) {
      for (let x = 0; x < width; x++) {
        if (cells[y][x].type === CellType.WALL) {
          cells[y][x] = { type: CellType.ROAD, walkable: true };
        }
      }
    }

    // Ensure road to each slot
    slots.forEach((slot) => {
      this.ensureRoadToSlot(cells, slot, width, height);
    });
  }

  /**
   * Ensure there's a road adjacent to slot
   */
  private static ensureRoadToSlot(
    cells: ParkingCell[][],
    slot: ParkingSlot,
    width: number,
    height: number
  ): void {
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 }, // Right
      { dx: 0, dy: 1 }, // Down
      { dx: -1, dy: 0 }, // Left
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

    // Create road below if no adjacent road
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
}

/**
 * Compatibility function - for backward compatibility
 */
export const generateFloorLayout = (floorLevel: number): FloorLayout => {
  return FloorLayoutGenerator.generateMockFloorLayout(floorLevel);
};