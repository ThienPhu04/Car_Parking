import { CellType, EntryPoint, ExitPoint, FloorLayout, ParkingCell, ParkingSlot, SlotStatus } from "@app-types/parking.types";

/**
 * Generate mock floor layout với lối vào, lối ra và đường đi
 */
export const generateFloorLayout = (floor: number): FloorLayout => {
  const width = 12;  // 12 cột
  const height = 20; // 20 hàng

  // Khởi tạo grid với walls
  const cells: ParkingCell[][] = Array(height).fill(null).map((_, y) =>
    Array(width).fill(null).map((_, x) => ({
      x,
      y,
      type: CellType.WALL,
      walkable: false,
    }))
  );

  // Tạo đường đi chính (central road) - Cột 5 và 6
  for (let y = 0; y < height; y++) {
    cells[y][5] = { x: 5, y, type: CellType.ROAD, walkable: true };
    cells[y][6] = { x: 6, y, type: CellType.ROAD, walkable: true };
  }

  // Tạo đường ngang (horizontal roads)
  for (let y = 2; y < height; y += 4) {
    for (let x = 0; x < width; x++) {
      if (cells[y][x].type === CellType.WALL) {
        cells[y][x] = { x, y, type: CellType.ROAD, walkable: true };
      }
    }
  }

  // Lối vào (Entry) - Đầu đường chính
  const entries: EntryPoint[] = [
    {
      id: `entry_${floor}_1`,
      name: `Lối vào ${floor}A`,
      floor,
      x: 5,
      y: 0,
      type: CellType.ENTRY,
      walkable: true,
    },
    {
      id: `entry_${floor}_2`,
      name: `Lối vào ${floor}B`,
      floor,
      x: 6,
      y: 0,
      type: CellType.ENTRY,
      walkable: true,
    },
  ];

  entries.forEach(entry => {
    cells[entry.y][entry.x] = entry;
  });

  // Lối ra (Exit) - Cuối đường chính
  const exits: ExitPoint[] = [
    {
      id: `exit_${floor}_1`,
      name: `Lối ra ${floor}A`,
      floor,
      x: 5,
      y: height - 1,
      type: CellType.EXIT,
      walkable: true,
    },
    {
      id: `exit_${floor}_2`,
      name: `Lối ra ${floor}B`,
      floor,
      x: 6,
      y: height - 1,
      type: CellType.EXIT,
      walkable: true,
    },
  ];

  exits.forEach(exit => {
    cells[exit.y][exit.x] = exit;
  });

  // Tạo các ô đỗ xe
  const slots: ParkingSlot[] = [];
  let slotIndex = 1;

  // Slots bên trái đường chính
  for (let y = 1; y < height - 1; y++) {
    if (cells[y][2].type === CellType.ROAD) continue; // Skip horizontal roads
    
    for (let x = 1; x <= 3; x++) {
      if (cells[y][x].type === CellType.WALL) {
        const slot: ParkingSlot = {
          id: `slot_${floor}_L${slotIndex}`,
          code: `L${slotIndex}`,
          floor,
          x,
          y,
          type: CellType.SLOT,
          status: Math.random() > 0.6 ? SlotStatus.AVAILABLE : 
                  Math.random() > 0.5 ? SlotStatus.OCCUPIED : SlotStatus.RESERVED,
          walkable: false,
          features: x === 1 ? ['near_elevator'] : undefined,
        };
        slots.push(slot);
        cells[y][x] = slot;
        slotIndex++;
      }
    }
  }

  slotIndex = 1;
  // Slots bên phải đường chính
  for (let y = 1; y < height - 1; y++) {
    if (cells[y][2].type === CellType.ROAD) continue;
    
    for (let x = 8; x <= 10; x++) {
      if (cells[y][x].type === CellType.WALL) {
        const slot: ParkingSlot = {
          id: `slot_${floor}_R${slotIndex}`,
          code: `R${slotIndex}`,
          floor,
          x,
          y,
          type: CellType.SLOT,
          status: Math.random() > 0.6 ? SlotStatus.AVAILABLE : 
                  Math.random() > 0.5 ? SlotStatus.OCCUPIED : SlotStatus.RESERVED,
          walkable: false,
          features: x === 10 ? ['near_exit'] : undefined,
        };
        slots.push(slot);
        cells[y][x] = slot;
        slotIndex++;
      }
    }
  }

  return {
    floor,
    width,
    height,
    cells,
    slots,
    entries,
    exits,
  };
};