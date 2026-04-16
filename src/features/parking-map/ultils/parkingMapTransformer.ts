import {
  ParkingMapDTO, FloorDTO, ZoneDTO, GroupSlotDTO,
  LaneDTO, RawSlotDTO,
  ParkingMap, Floor, FloorLayout, ParkingSlot,
  EntryPoint, ExitPoint, ParkingCell, ZoneCell,
  CellType, Position, SlotStatus, ZoneLayout, LaneLayout,
} from '../../../types/parking.types';

const CELL_SIZE = 25;

function toGrid(canvasPx: number, offset: number): number {
  return Math.round((canvasPx + offset) / CELL_SIZE);
}

function toGridPrecise(canvasPx: number, offset: number): number {
  return (canvasPx + offset) / CELL_SIZE;
}

function toGridMin(canvasPx: number, offset: number): number {
  return Math.floor((canvasPx + offset) / CELL_SIZE);
}

function toGridMax(canvasPx: number, offset: number): number {
  return Math.ceil((canvasPx + offset) / CELL_SIZE);
}

function normalizeRectByRotation(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const deg = ((rotation % 360) + 360) % 360;
  const isQuarterTurn = Math.abs(deg - 90) < 1 || Math.abs(deg - 270) < 1;
  return isQuarterTurn ? { width: height, height: width } : { width, height };
}

function getLaneCanvasBounds(lane: LaneDTO): { left: number; top: number; right: number; bottom: number } {
  if (Array.isArray(lane.points) && lane.points.length >= 4) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < lane.points.length; i += 2) {
      const x = Number(lane.points[i]);
      const y = Number(lane.points[i + 1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
      const thickness = typeof lane.laneWidth === 'number'
        ? lane.laneWidth
        : (typeof lane.witdh === 'number' ? lane.witdh : CELL_SIZE);
      const pad = Math.max(thickness, CELL_SIZE) / 2;
      return {
        left:   minX - pad,
        top:    minY - pad,
        right:  maxX + pad,
        bottom: maxY + pad,
      };
    }
  }

  const rawWidth = Math.max(lane.witdh ?? CELL_SIZE, CELL_SIZE);
  const rawHeight = Math.max(lane.height ?? CELL_SIZE, CELL_SIZE);
  const normalized = normalizeRectByRotation(rawWidth, rawHeight, lane.rotation ?? 0);
  const left = lane.positionX;
  const top = lane.positionY;
  return {
    left,
    top,
    right: left + normalized.width,
    bottom: top + normalized.height,
  };
}

function rotateAround(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  angleDeg: number,
): { x: number; y: number } {
  if (!angleDeg) return { x, y };

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - centerX;
  const dy = y - centerY;

  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}


function getGroupSlotCorners(group: GroupSlotDTO): Array<{ x: number; y: number }> {
  const width = group.width ?? CELL_SIZE;
  const height = group.height ?? CELL_SIZE;
  const centerX = group.positionX;
  const centerY = group.positionY;
  const halfW = width / 2;
  const halfH = height / 2;
  const corners = [
    { x: centerX - halfW, y: centerY - halfH },
    { x: centerX + halfW, y: centerY - halfH },
    { x: centerX + halfW, y: centerY + halfH },
    { x: centerX - halfW, y: centerY + halfH },
  ];

  return corners.map(c => rotateAround(c.x, c.y, centerX, centerY, group.rotation ?? 0));
}


// ─── Tính offset để shift tọa độ âm về ≥ 0 ──────────────────────────────────

function calcFloorOffset(dto: FloorDTO): { ox: number; oy: number } {
  let minX = Infinity;
  let minY = Infinity;

  // Boundary của floor
  if (dto.boundary?.points) {
    for (let i = 0; i < dto.boundary.points.length; i += 2) {
      minX = Math.min(minX, dto.boundary.points[i]);
      minY = Math.min(minY, dto.boundary.points[i + 1]);
    }
  }
  // Zone points
  for (const z of dto.zones ?? []) {
    for (let i = 0; i < z.points.length; i += 2) {
      minX = Math.min(minX, z.points[i]);
      minY = Math.min(minY, z.points[i + 1]);
    }
    // GroupSlot positions
    for (const g of z.groupSlots ?? []) {
      const corners = getGroupSlotCorners(g);
      for (const c of corners) {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
      }
    }
  }
  // Entrances / Exits / Lanes
  for (const e of dto.entrances ?? []) { minX = Math.min(minX, e.positionX); minY = Math.min(minY, e.positionY); }
  for (const e of dto.exits     ?? []) { minX = Math.min(minX, e.positionX); minY = Math.min(minY, e.positionY); }
  for (const l of dto.lanes     ?? []) {
    const bounds = getLaneCanvasBounds(l);
    minX = Math.min(minX, bounds.left, bounds.right);
    minY = Math.min(minY, bounds.top, bounds.bottom);
  }

  return {
    ox: isFinite(minX) ? -minX : 0,
    oy: isFinite(minY) ? -minY : 0,
  };
}

// ─── Tính kích thước grid ────────────────────────────────────────────────────

function calcGridSize(dto: FloorDTO, ox: number, oy: number): { width: number; height: number } {
  let maxGX = 11;
  let maxGY = 11;

  if (dto.boundary?.points) {
    for (let i = 0; i < dto.boundary.points.length; i += 2) {
      maxGX = Math.max(maxGX, toGrid(dto.boundary.points[i],     ox));
      maxGY = Math.max(maxGY, toGrid(dto.boundary.points[i + 1], oy));
    }
  }
  for (const z of dto.zones ?? []) {
    for (let i = 0; i < z.points.length; i += 2) {
      maxGX = Math.max(maxGX, toGrid(z.points[i],     ox));
      maxGY = Math.max(maxGY, toGrid(z.points[i + 1], oy));
    }
    for (const g of z.groupSlots ?? []) {
      const corners = getGroupSlotCorners(g);
      for (const c of corners) {
        maxGX = Math.max(maxGX, toGridMax(c.x, ox));
        maxGY = Math.max(maxGY, toGridMax(c.y, oy));
      }
    }
  }
  for (const e of dto.entrances ?? []) { maxGX = Math.max(maxGX, toGrid(e.positionX + e.witdh, ox)); maxGY = Math.max(maxGY, toGrid(e.positionY + e.height, oy)); }
  for (const e of dto.exits     ?? []) { maxGX = Math.max(maxGX, toGrid(e.positionX + e.witdh, ox)); maxGY = Math.max(maxGY, toGrid(e.positionY + e.height, oy)); }
  for (const lane of dto.lanes ?? []) {
    const bounds = getLaneCanvasBounds(lane);
    maxGX = Math.max(maxGX, toGridMax(bounds.right, ox));
    maxGY = Math.max(maxGY, toGridMax(bounds.bottom, oy));
  }

  return { width: maxGX + 2, height: maxGY + 2 };
}

// ─── TRANSFORMER CLASS ────────────────────────────────────────────────────────

export class ParkingMapTransformer {
  private static getSlotStatusFromSensor(raw: RawSlotDTO): {
    status: SlotStatus;
    statusName: string;
  } {
    if (typeof raw.sensorStatus === 'boolean') {
      return raw.sensorStatus
        ? { status: SlotStatus.OCCUPIED, statusName: 'Đã có xe' }
        : { status: SlotStatus.AVAILABLE, statusName: 'Trống' };
    }

    // Fallback for payloads that do not provide sensorStatus.
    switch (raw.status) {
      case SlotStatus.AVAILABLE:
        return { status: SlotStatus.AVAILABLE, statusName: 'Trống' };
      case SlotStatus.RESERVED:
        return { status: SlotStatus.RESERVED, statusName: 'Đã đặt' };
      case SlotStatus.OCCUPIED:
        return { status: SlotStatus.OCCUPIED, statusName: 'Đã có xe' };
      default:
        return { status: SlotStatus.AVAILABLE, statusName: 'Trống' };
    }
  }

  private static mapApiSlotStatus(raw: RawSlotDTO): {
    status: SlotStatus;
    statusName: string;
  } {
    if (raw.status === 2) {
      return { status: SlotStatus.RESERVED, statusName: 'Da dat' };
    }

    if (typeof raw.sensorStatus === 'boolean') {
      return raw.sensorStatus
        ? { status: SlotStatus.OCCUPIED, statusName: 'Da co xe' }
        : { status: SlotStatus.AVAILABLE, statusName: 'Trong' };
    }

    switch (raw.status) {
      case 0:
        return { status: SlotStatus.AVAILABLE, statusName: 'Trong' };
      case 1:
        return { status: SlotStatus.OCCUPIED, statusName: 'Da co xe' };
      case 2:
        return { status: SlotStatus.RESERVED, statusName: 'Da dat' };
      default:
        return { status: SlotStatus.AVAILABLE, statusName: raw.statusName || 'Trong' };
    }
  }

  static transformParkingMap(dto: ParkingMapDTO): ParkingMap {
    const floorDtos = Array.isArray(dto.floors) ? dto.floors : [];
    const floors: Floor[] = [];
    const layouts: FloorLayout[] = [];

    for (const floorDto of floorDtos) {
      floors.push(this.buildFloor(floorDto));
      layouts.push(this.buildLayout(floorDto));
    }

    return {
      code: dto.code, name: dto.name, location: dto.location,
      status: dto.status, statusName: dto.statusName,
      totalFloors: dto.totalFloors,
      floors, layouts,
    };
  }

  // ─── Floor domain object ─────────────────────────────────────────────────────

  static buildFloor(dto: FloorDTO): Floor {
    const floorId = dto._id ?? dto.code;
    const allSlots = (dto.zones ?? []).flatMap(zone =>
      (zone.groupSlots ?? []).flatMap(group => group.slots ?? []),
    );
    let available = 0;
    let occupied = 0;
    let reserved = 0;

    for (const slot of allSlots) {
      switch (this.mapApiSlotStatus(slot).status) {
        case SlotStatus.AVAILABLE:
          available++;
          break;
        case SlotStatus.OCCUPIED:
          occupied++;
          break;
        case SlotStatus.RESERVED:
          reserved++;
          break;
        default:
          break;
      }
    }

    return {
      id:             floorId,
      code:           dto.code,
      name:           dto.nameFloor,
      level:          dto.level,
      totalSlots:     allSlots.length,
      availableSlots: available,
      occupiedSlots:  occupied,
      reservedSlots:  reserved,
      entrances:      (dto.entrances ?? []).length,
      exits:          (dto.exits     ?? []).length,
      status:         dto.status,
      statusName:     dto.statusName,
      totalZones:     (dto.zones ?? []).length,
    };
  }

  // ─── Floor layout (grid) ─────────────────────────────────────────────────────

  static buildLayout(dto: FloorDTO): FloorLayout {
    const floorId = dto._id ?? dto.code;
    const { ox, oy }    = calcFloorOffset(dto);
    const { width, height } = calcGridSize(dto, ox, oy);
    const zones = this.buildZoneLayouts(dto, ox, oy);
    const lanes = this.buildLaneLayouts(dto, ox, oy);

    // 1. Init grid — toàn bộ WALL
    const cells: ParkingCell[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ type: CellType.WALL, walkable: false })),
    );

    // 2. Vẽ zone bounding boxes
    this.paintZones(cells, width, height, dto.zones ?? [], ox, oy);

    // 3. Vẽ lanes (đường đi thực tế từ Lane collection)
    const laneRoadCells = this.paintLanes(cells, width, height, dto.lanes ?? [], ox, oy);

    // 4. Đặt slots (mỗi GroupSlot là 1 dãy, tọa độ từ groupSlot.positionX/Y)
    const allSlots = this.buildSlots(dto, ox, oy);
    allSlots.forEach(slot => {
      if (slot.y >= 0 && slot.y < height && slot.x >= 0 && slot.x < width) {
        cells[slot.y][slot.x] = slot;
      }
    });

    // 5. Vẽ road fallback cho slot chưa có road kề
    allSlots.forEach(s => this.ensureRoad(cells, s, width, height));

    // 6. Entry / Exit với tọa độ thực
    const entries = this.buildEntries(dto, ox, oy);
    const exits   = this.buildExits(dto, ox, oy);
    entries.forEach(e => {
      if (e.y >= 0 && e.y < height && e.x >= 0 && e.x < width) cells[e.y][e.x] = e;
    });
    exits.forEach(e => {
      if (e.y >= 0 && e.y < height && e.x >= 0 && e.x < width) cells[e.y][e.x] = e;
    });

    // 7. Tạo mạng đường đi liên tục từ IN/OUT đến các khu slot
    this.connectAccessPointsToRoad(cells, [...entries, ...exits], laneRoadCells, width, height);
    this.connectSlotsToRoadNetwork(cells, allSlots, laneRoadCells, width, height);
    this.promoteNonSlotCellsToRoad(cells, width, height);

    return {
      floorId,
      floorLevel: dto.level,
      floorName:  dto.nameFloor,
      width, height, cells,
      slots: allSlots,
      entries,
      exits,
      zones,
      lanes,
      boundary: (dto.boundary?.points ?? []).reduce<Position[]>((result, value, index, source) => {
        if (index % 2 === 0 && Number.isFinite(value) && Number.isFinite(source[index + 1])) {
          result.push({
            x: toGridPrecise(value, ox),
            y: toGridPrecise(source[index + 1], oy),
          });
        }
        return result;
      }, []),
    };
  }

  static buildZoneLayouts(dto: FloorDTO, ox: number, oy: number): ZoneLayout[] {
    return (dto.zones ?? [])
      .map((zone): ZoneLayout | null => {
        const points: Position[] = [];
        for (let i = 0; i < (zone.points?.length ?? 0); i += 2) {
          points.push({
            x: toGridPrecise(zone.points[i], ox),
            y: toGridPrecise(zone.points[i + 1], oy),
          });
        }

        if (points.length < 3) return null;
        return { code: zone.code, name: zone.nameZone, points, color: zone.color };
      })
      .filter((zone): zone is ZoneLayout => zone !== null);
  }

  static buildLaneLayouts(dto: FloorDTO, ox: number, oy: number): LaneLayout[] {
    const result: LaneLayout[] = [];

    (dto.lanes ?? []).forEach((lane, idx) => {
      const rawPoints = Array.isArray(lane.points) ? lane.points : [];
      if (rawPoints.length < 4) return;

      const points: Position[] = [];
      for (let i = 0; i < rawPoints.length; i += 2) {
        const x = Number(rawPoints[i]);
        const y = Number(rawPoints[i + 1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        points.push({ x: toGridPrecise(x, ox), y: toGridPrecise(y, oy) });
      }

      if (points.length < 2) return;

      result.push({
        code: lane.code ?? lane._id ?? `lane-${idx}`,
        points,
        laneWidth: typeof lane.laneWidth === 'number'
          ? lane.laneWidth
          : (typeof lane.witdh === 'number' ? lane.witdh : CELL_SIZE),
      });
    });

    return result;
  }

  // ─── Build slots từ zones → groupSlots → slots ───────────────────────────────
  //
  // Mỗi GroupSlot là 1 dãy xe (có positionX/Y + direction + width + height).
  // Các Slot trong GroupSlot được xếp ngang/dọc theo direction.

  static buildSlots(dto: FloorDTO, ox: number, oy: number): ParkingSlot[] {
    const result: ParkingSlot[] = [];

    for (const zone of dto.zones ?? []) {
      for (const group of zone.groupSlots ?? []) {
        const rawSlots = group.slots ?? [];
        const count    = rawSlots.length;
        if (count === 0) continue;

        // Kích thước mỗi slot = width/height của group chia đều
        const isHorizontal = (group.direction ?? 'horizontal') !== 'vertical';
        const slotCanvasW  = isHorizontal ? group.width / count : group.width;
        const slotCanvasH  = isHorizontal ? group.height : group.height / count;
        const centerX = group.positionX;
        const centerY = group.positionY;
        const originX = centerX - group.width / 2;
        const originY = centerY - group.height / 2;

        rawSlots.forEach((raw, idx) => {
          const mappedStatus = this.mapApiSlotStatus(raw);
          if (mappedStatus.status !== SlotStatus.AVAILABLE) return;

          // Tọa độ tâm ô slot trong canvas
          const rawX = isHorizontal
            ? originX + slotCanvasW * idx + slotCanvasW / 2
            : originX + slotCanvasW / 2;
          const rawY = isHorizontal
            ? originY + slotCanvasH / 2
            : originY + slotCanvasH * idx + slotCanvasH / 2;
          const rotated = rotateAround(rawX, rawY, centerX, centerY, group.rotation ?? 0);

          result.push({
            id:           raw.code,
            code:         raw.code,
            name:         raw.nameSlot,
            floorId:      dto._id ?? dto.code,
            floorLevel:   dto.level,
            zone:         zone.nameZone,
            x:            toGrid(rotated.x, ox),
            y:            toGrid(rotated.y, oy),
            status:       mappedStatus.status,
            statusName:   mappedStatus.statusName,
            isActive:     raw.isActive,
            isSensorReal: raw.isSensorReal,
            sensorId:     raw.sensorId ?? undefined,
            type:         CellType.SLOT,
            walkable:     false,
            features:     [],
            rotation:     group.rotation ?? 0,
            canvasX:      toGridPrecise(rotated.x, ox),
            canvasY:      toGridPrecise(rotated.y, oy),
            slotWidth:    slotCanvasW / CELL_SIZE,
            slotHeight:   slotCanvasH / CELL_SIZE,
          });
        });
      }
    }

    return result;
  }

  // ─── Paint zone backgrounds ──────────────────────────────────────────────────

  static paintZones(
    cells: ParkingCell[][], w: number, h: number,
    zones: ZoneDTO[], ox: number, oy: number,
  ): void {
    for (const zone of zones) {
      if (!zone.points || zone.points.length < 4) continue;

      const gxs: number[] = [];
      const gys: number[] = [];
      for (let i = 0; i < zone.points.length; i += 2) {
        gxs.push(toGrid(zone.points[i],     ox));
        gys.push(toGrid(zone.points[i + 1], oy));
      }

      const sx = Math.max(0,     Math.min(...gxs));
      const sy = Math.max(0,     Math.min(...gys));
      const ex = Math.min(w - 1, Math.max(...gxs));
      const ey = Math.min(h - 1, Math.max(...gys));

      for (let y = sy; y <= ey; y++) {
        for (let x = sx; x <= ex; x++) {
          if (cells[y]?.[x]?.type === CellType.WALL) {
            const zoneCell: ZoneCell = {
              type: CellType.ZONE, walkable: false,
              zoneCode: zone.code,
              zoneName: zone.nameZone,
            };
            cells[y][x] = zoneCell;
          }
        }
      }
    }
  }

  // ─── Paint lanes (đường đi thực tế) ─────────────────────────────────────────
  //
  // Lane có positionX/Y (tâm), witdh, height, rotation.
  // Khi rotation=0: lane nằm ngang.

  static paintLanes(
    cells: ParkingCell[][], w: number, h: number,
    lanes: LaneDTO[], ox: number, oy: number,
  ): Position[] {
    const road = (): ParkingCell => ({ type: CellType.ROAD, walkable: true });
    const roadSet = new Set<string>();

    for (const lane of lanes) {
      const bounds = getLaneCanvasBounds(lane);
      const sx = Math.max(0, toGridMin(bounds.left, ox));
      const sy = Math.max(0, toGridMin(bounds.top, oy));
      const ex = Math.min(w - 1, toGridMax(bounds.right, ox));
      const ey = Math.min(h - 1, toGridMax(bounds.bottom, oy));

      for (let y = sy; y <= ey; y++) {
        for (let x = sx; x <= ex; x++) {
          if (cells[y]?.[x]?.type !== CellType.SLOT &&
              cells[y]?.[x]?.type !== CellType.ENTRY &&
              cells[y]?.[x]?.type !== CellType.EXIT) {
            cells[y][x] = road();
            roadSet.add(`${x},${y}`);
          }
        }
      }
    }

    return Array.from(roadSet).map(item => {
      const [x, y] = item.split(',').map(Number);
      return { x, y };
    });
  }

  // ─── Đảm bảo slot có ít nhất 1 ô road kề ────────────────────────────────────

  static ensureRoad(cells: ParkingCell[][], slot: ParkingSlot, w: number, h: number): void {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    const hasRoad = dirs.some(({ dx, dy }) => {
      const nx = slot.x + dx; const ny = slot.y + dy;
      return nx >= 0 && nx < w && ny >= 0 && ny < h
        && cells[ny]?.[nx]?.type === CellType.ROAD;
    });
    if (!hasRoad) {
      for (const { dx, dy } of [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }]) {
        const nx = slot.x + dx; const ny = slot.y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h
          && cells[ny]?.[nx]?.type !== CellType.SLOT) {
          cells[ny][nx] = { type: CellType.ROAD, walkable: true };
          break;
        }
      }
    }
  }

  // ─── Entries / Exits với tọa độ thực ────────────────────────────────────────

  static connectAccessPointsToRoad(
    cells: ParkingCell[][],
    points: Array<EntryPoint | ExitPoint>,
    laneRoadCells: Position[],
    w: number,
    h: number,
  ): void {
    for (const point of points) {
      const start = { x: point.x, y: point.y };
      const target = this.findNearestTarget(start, laneRoadCells, cells, w, h);
      if (!target) continue;
      this.carveRoad(cells, start, target, w, h);
    }
  }

  static connectSlotsToRoadNetwork(
    cells: ParkingCell[][],
    slots: ParkingSlot[],
    laneRoadCells: Position[],
    w: number,
    h: number,
  ): void {
    for (const slot of slots) {
      const roadAnchor = this.findAdjacentWalkableCell(cells, slot.x, slot.y, w, h);
      if (!roadAnchor) continue;

      const target = this.findNearestTarget(roadAnchor, laneRoadCells, cells, w, h, roadAnchor);
      if (!target) continue;

      this.carveRoad(cells, roadAnchor, target, w, h);
    }
  }

  static findAdjacentWalkableCell(
    cells: ParkingCell[][],
    x: number,
    y: number,
    w: number,
    h: number,
  ): Position | null {
    const dirs = [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 }];
    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (!this.inBounds(nx, ny, w, h)) continue;
      if (cells[ny][nx].walkable) return { x: nx, y: ny };
    }
    return null;
  }

  static findNearestTarget(
    start: Position,
    preferredTargets: Position[],
    cells: ParkingCell[][],
    w: number,
    h: number,
    except?: Position,
  ): Position | null {
    const sourceTargets = preferredTargets.length > 0
      ? preferredTargets
      : this.collectWalkableCells(cells, w, h);

    let best: Position | null = null;
    let bestDist = Infinity;

    for (const target of sourceTargets) {
      if (target.x === start.x && target.y === start.y) continue;
      if (except && target.x === except.x && target.y === except.y) continue;

      const dist = Math.abs(target.x - start.x) + Math.abs(target.y - start.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
      }
    }

    return best;
  }

  static collectWalkableCells(cells: ParkingCell[][], w: number, h: number): Position[] {
    const result: Position[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cells[y][x].walkable) result.push({ x, y });
      }
    }
    return result;
  }

  static carveRoad(
    cells: ParkingCell[][],
    start: Position,
    end: Position,
    w: number,
    h: number,
  ): boolean {
    if (start.x === end.x && start.y === end.y) return true;

    const candidates = [
      this.buildManhattanPath(start, end, true),
      this.buildManhattanPath(start, end, false),
    ].filter(path => path.length > 0 && this.isPathBuildable(path, cells, w, h));

    if (candidates.length === 0) return false;

    candidates.sort((a, b) => this.pathCost(a, cells) - this.pathCost(b, cells) || a.length - b.length);
    const path = candidates[0];

    for (const node of path) {
      if (!this.inBounds(node.x, node.y, w, h)) continue;
      const cell = cells[node.y][node.x];
      if (cell.type === CellType.SLOT || cell.type === CellType.ENTRY || cell.type === CellType.EXIT) continue;
      if (cell.type !== CellType.ROAD || !cell.walkable) {
        cells[node.y][node.x] = { type: CellType.ROAD, walkable: true };
      }
    }

    return true;
  }

  static buildManhattanPath(start: Position, end: Position, xFirst: boolean): Position[] {
    const path: Position[] = [];
    let x = start.x;
    let y = start.y;

    if (xFirst) {
      while (x !== end.x) {
        x += Math.sign(end.x - x);
        path.push({ x, y });
      }
      while (y !== end.y) {
        y += Math.sign(end.y - y);
        path.push({ x, y });
      }
      return path;
    }

    while (y !== end.y) {
      y += Math.sign(end.y - y);
      path.push({ x, y });
    }
    while (x !== end.x) {
      x += Math.sign(end.x - x);
      path.push({ x, y });
    }

    return path;
  }

  static isPathBuildable(path: Position[], cells: ParkingCell[][], w: number, h: number): boolean {
    return path.every(node =>
      this.inBounds(node.x, node.y, w, h) &&
      cells[node.y][node.x].type !== CellType.SLOT
    );
  }

  static pathCost(path: Position[], cells: ParkingCell[][]): number {
    return path.reduce((cost, node) => cost + (cells[node.y][node.x].walkable ? 0 : 1), 0);
  }

  static inBounds(x: number, y: number, w: number, h: number): boolean {
    return x >= 0 && x < w && y >= 0 && y < h;
  }

  static promoteNonSlotCellsToRoad(cells: ParkingCell[][], w: number, h: number): void {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = cells[y][x];
        if (cell.type === CellType.SLOT || cell.type === CellType.ENTRY || cell.type === CellType.EXIT) {
          continue;
        }
        cells[y][x] = { type: CellType.ROAD, walkable: true };
      }
    }
  }

  static buildEntries(dto: FloorDTO, ox: number, oy: number): EntryPoint[] {
    return (dto.entrances ?? []).map((e, i) => ({
      id:         `${dto.code}-ENTRY-${e.code}`,
      name:       `Lối vào ${i + 1}`,
      floorId:    dto._id ?? dto.code,
      floorLevel: dto.level,
      x:          toGrid(e.positionX + (e.witdh ?? CELL_SIZE) / 2, ox),
      y:          toGrid(e.positionY + (e.height ?? CELL_SIZE) / 2, oy),
      type:       CellType.ENTRY,
      walkable:   true,
    }));
  }

  static buildExits(dto: FloorDTO, ox: number, oy: number): ExitPoint[] {
    return (dto.exits ?? []).map((e, i) => ({
      id:         `${dto.code}-EXIT-${e.code}`,
      name:       `Lối ra ${i + 1}`,
      floorId:    dto._id ?? dto.code,
      floorLevel: dto.level,
      x:          toGrid(e.positionX + (e.witdh ?? CELL_SIZE) / 2, ox),
      y:          toGrid(e.positionY + (e.height ?? CELL_SIZE) / 2, oy),
      type:       CellType.EXIT,
      walkable:   true,
    }));
  }

  // ─── Real-time MQTT update ───────────────────────────────────────────────────

  static updateSlotStatus(
    layout: FloorLayout, slotCode: string,
    newStatus: SlotStatus, newStatusName: string,
  ): FloorLayout {
    return {
      ...layout,
      slots: layout.slots.map(s =>
        s.code === slotCode ? { ...s, status: newStatus, statusName: newStatusName } : s,
      ),
      cells: layout.cells.map(row =>
        row.map(cell => {
          if (cell.type !== CellType.SLOT) return cell;
          const s = cell as ParkingSlot;
          return s.code === slotCode
            ? { ...s, status: newStatus, statusName: newStatusName }
            : cell;
        }),
      ),
    };
  }
}
