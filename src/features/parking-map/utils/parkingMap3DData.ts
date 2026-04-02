import {
  CellType,
  FloorLayout,
  ParkingCell,
  ParkingSlot,
  Position,
  SlotStatus,
} from '../../../types/parking.types';
import type { ZoneCell } from '../../../types/parking.types';

const GRID_UNIT = 100;
const SLOT_LENGTH = 74;
const SLOT_THICKNESS = 30;
const GATE_WIDTH = 68;
const GATE_DEPTH = 42;
const SLOT_VISUAL_SCALE = 1.18;
const SLOT_SPACING_FILL = 0.84;
const SLOT_MIN_RENDER_WIDTH = 92;
const SLOT_MIN_RENDER_DEPTH = 44;

export type Parking3DStatus = 'empty' | 'reserved' | 'occupied';

export interface ParkingMap3DPoint {
  x: number;
  y: number;
}

export interface ParkingMap3DZone {
  id: string;
  code: string;
  name: string;
  color: string;
  displayColor?: string;
  points: ParkingMap3DPoint[];
  centroid: ParkingMap3DPoint;
}

export interface ParkingMap3DLane {
  id: string;
  code: string;
  points: ParkingMap3DPoint[];
  width: number;
}

export interface ParkingMap3DGate {
  id: string;
  code: string;
  kind: 'entrance' | 'exit';
  positionX: number;
  positionY: number;
  width: number;
  depth: number;
  rotation: number;
}

export interface ParkingMap3DSlot {
  id: string;
  code: string;
  label: string;
  position2d: ParkingMap3DPoint;
  rotation: number;
  status: Parking3DStatus;
  zoneName: string;
  groupCode: string | null;
  size: {
    width: number;
    depth: number;
  };
}

export interface ParkingMap3DLayoutData {
  parkingLot: {
    name: string;
  };
  floor: {
    name: string;
    boundary: ParkingMap3DPoint[];
  };
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  zones: ParkingMap3DZone[];
  lanes: ParkingMap3DLane[];
  gates: ParkingMap3DGate[];
  slots: ParkingMap3DSlot[];
  stats: {
    total: number;
    empty: number;
    reserved: number;
    occupied: number;
  };
}

export interface ParkingMap3DViewState {
  selectedSlotId: string | null;
  route: ParkingMap3DPoint[];
}

const STATUS_PALETTE: Record<SlotStatus, Parking3DStatus> = {
  [SlotStatus.AVAILABLE]: 'empty',
  [SlotStatus.RESERVED]: 'reserved',
  [SlotStatus.OCCUPIED]: 'occupied',
};

const ZONE_COLORS = [
  '#4e70ab',
  '#6a5ca8',
  '#4c7ca6',
  '#8d5d9f',
  '#587cbe',
  '#3f7b92',
];

const toWorldPoint = (x: number, y: number): ParkingMap3DPoint => ({
  x: x * GRID_UNIT,
  y: y * GRID_UNIT,
});

const rectPoints = (minX: number, minY: number, maxX: number, maxY: number): ParkingMap3DPoint[] => [
  toWorldPoint(minX, minY),
  toWorldPoint(maxX, minY),
  toWorldPoint(maxX, maxY),
  toWorldPoint(minX, maxY),
];

const collectZoneMeta = (
  cells: ParkingCell[][],
): Array<{ code: string; name: string; minX: number; minY: number; maxX: number; maxY: number }> => {
  const map = new Map<
    string,
    { code: string; name: string; minX: number; minY: number; maxX: number; maxY: number }
  >();

  cells.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell.type !== CellType.ZONE) {
        return;
      }

      const zoneCell = cell as unknown as ZoneCell;
      const key = zoneCell.zoneCode ?? zoneCell.zoneName ?? `zone-${x}-${y}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          code: key,
          name: zoneCell.zoneName ?? key,
          minX: x,
          minY: y,
          maxX: x + 1,
          maxY: y + 1,
        });
        return;
      }

      existing.minX = Math.min(existing.minX, x);
      existing.minY = Math.min(existing.minY, y);
      existing.maxX = Math.max(existing.maxX, x + 1);
      existing.maxY = Math.max(existing.maxY, y + 1);
    }),
  );

  return Array.from(map.values());
};

const getCentroid = (points: ParkingMap3DPoint[]): ParkingMap3DPoint => {
  if (!points.length) {
    return { x: 0, y: 0 };
  }

  const total = points.reduce(
    (result, point) => ({
      x: result.x + point.x,
      y: result.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
};

const getAxisSpacing = (
  slot: ParkingMap3DSlot,
  slots: ParkingMap3DSlot[],
  axis: 'width' | 'depth',
) => {
  const rotationRadians = (slot.rotation * Math.PI) / 180;
  const axisVector = axis === 'width'
    ? { x: Math.cos(rotationRadians), y: Math.sin(rotationRadians) }
    : { x: -Math.sin(rotationRadians), y: Math.cos(rotationRadians) };
  const crossVector = axis === 'width'
    ? { x: -Math.sin(rotationRadians), y: Math.cos(rotationRadians) }
    : { x: Math.cos(rotationRadians), y: Math.sin(rotationRadians) };
  const slotCrossSize = axis === 'width' ? slot.size.depth : slot.size.width;

  let nearestSpacing = Infinity;

  slots.forEach(otherSlot => {
    if (otherSlot.id === slot.id) {
      return;
    }

    const dx = otherSlot.position2d.x - slot.position2d.x;
    const dy = otherSlot.position2d.y - slot.position2d.y;
    const projectedAxis = dx * axisVector.x + dy * axisVector.y;
    const projectedCross = dx * crossVector.x + dy * crossVector.y;
    const otherCrossSize = axis === 'width' ? otherSlot.size.depth : otherSlot.size.width;
    const crossThreshold = Math.max(slotCrossSize, otherCrossSize) * 0.7;

    if (Math.abs(projectedCross) > crossThreshold) {
      return;
    }

    const spacing = Math.abs(projectedAxis);
    if (spacing > 1) {
      nearestSpacing = Math.min(nearestSpacing, spacing);
    }
  });

  return nearestSpacing;
};

const getExpandedSlotSize = (
  slot: ParkingMap3DSlot,
  slots: ParkingMap3DSlot[],
) => {
  const baseWidth = Math.max(slot.size.width, SLOT_MIN_RENDER_WIDTH);
  const baseDepth = Math.max(slot.size.depth, SLOT_MIN_RENDER_DEPTH);
  const widthSpacing = getAxisSpacing(slot, slots, 'width');
  const depthSpacing = getAxisSpacing(slot, slots, 'depth');

  const expandedWidth = Number.isFinite(widthSpacing)
    ? Math.min(baseWidth * SLOT_VISUAL_SCALE, widthSpacing * SLOT_SPACING_FILL)
    : baseWidth * SLOT_VISUAL_SCALE;
  const expandedDepth = Number.isFinite(depthSpacing)
    ? Math.min(baseDepth * SLOT_VISUAL_SCALE, depthSpacing * SLOT_SPACING_FILL)
    : baseDepth * SLOT_VISUAL_SCALE;

  return {
    width: Math.max(baseWidth, expandedWidth),
    depth: Math.max(baseDepth, expandedDepth),
  };
};

const getSlotOrientation = (
  slotLookup: Set<string>,
  slot: ParkingSlot,
): 'horizontal' | 'vertical' => {
  const left = slotLookup.has(`${slot.x - 1}:${slot.y}`);
  const right = slotLookup.has(`${slot.x + 1}:${slot.y}`);
  const top = slotLookup.has(`${slot.x}:${slot.y - 1}`);
  const bottom = slotLookup.has(`${slot.x}:${slot.y + 1}`);

  const horizontalScore = Number(left) + Number(right);
  const verticalScore = Number(top) + Number(bottom);

  if (horizontalScore > verticalScore) {
    return 'horizontal';
  }
  if (verticalScore > horizontalScore) {
    return 'vertical';
  }

  return slot.x % 2 === 0 ? 'vertical' : 'horizontal';
};

const getLayoutBoundary = (layout: FloorLayout): ParkingMap3DPoint[] => {
  if (layout.boundary?.length) {
    return layout.boundary.map(point => toWorldPoint(point.x, point.y));
  }

  return rectPoints(0, 0, layout.width, layout.height);
};

const getWorldBounds = (
  layout: FloorLayout,
  boundary: ParkingMap3DPoint[],
  zones: ParkingMap3DZone[],
  lanes: ParkingMap3DLane[],
  gates: ParkingMap3DGate[],
  slots: ParkingMap3DSlot[],
) => {
  const points: ParkingMap3DPoint[] = [
    ...boundary,
    ...zones.flatMap(zone => zone.points),
    ...lanes.flatMap(lane => lane.points),
    ...gates.map(gate => ({ x: gate.positionX, y: gate.positionY })),
    ...slots.flatMap(slot => {
      const halfWidth = slot.size.width / 2;
      const halfDepth = slot.size.depth / 2;
      return [
        { x: slot.position2d.x - halfWidth, y: slot.position2d.y - halfDepth },
        { x: slot.position2d.x + halfWidth, y: slot.position2d.y + halfDepth },
      ];
    }),
  ].filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!points.length) {
    const minX = 0;
    const minY = 0;
    const maxX = layout.width * GRID_UNIT;
    const maxY = layout.height * GRID_UNIT;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const padding = GRID_UNIT * 1.2;

  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

export const buildParkingMap3DLayoutData = (layout: FloorLayout): ParkingMap3DLayoutData => {
  const zoneMeta = collectZoneMeta(layout.cells);
  const boundary = getLayoutBoundary(layout);
  const slotLookup = new Set(layout.slots.map(slot => `${slot.x}:${slot.y}`));

  const zones: ParkingMap3DZone[] = layout.zones?.length
    ? layout.zones.map((zone, index) => {
        const points = zone.points.map(point => toWorldPoint(point.x, point.y));
        return {
          id: zone.code,
          code: zone.code,
          name: zone.name,
          color: ZONE_COLORS[index % ZONE_COLORS.length],
          displayColor: zone.color || undefined,
          centroid: getCentroid(points),
          points,
        };
      })
    : zoneMeta.map((zone, index) => {
        const points = rectPoints(zone.minX, zone.minY, zone.maxX, zone.maxY);
        return {
          id: zone.code,
          code: zone.code,
          name: zone.name,
          color: ZONE_COLORS[index % ZONE_COLORS.length],
          centroid: getCentroid(points),
          points,
        };
      });

  const lanes: ParkingMap3DLane[] = (layout.lanes ?? []).map((lane, index) => ({
    id: lane.code ?? `lane-${index}`,
    code: lane.code ?? `lane-${index}`,
    points: lane.points.map(point => toWorldPoint(point.x, point.y)),
    width: Math.max(60, (lane.laneWidth ?? 40) * 1.6),
  }));

  const gates: ParkingMap3DGate[] = [
    ...layout.entries.map(entry => ({
      id: entry.id,
      code: entry.name ?? entry.id,
      kind: 'entrance' as const,
      positionX: (entry.x + 0.5) * GRID_UNIT,
      positionY: (entry.y + 0.5) * GRID_UNIT,
      width: GATE_WIDTH,
      depth: GATE_DEPTH,
      rotation: 0,
    })),
    ...layout.exits.map(exit => ({
      id: exit.id,
      code: exit.name ?? exit.id,
      kind: 'exit' as const,
      positionX: (exit.x + 0.5) * GRID_UNIT,
      positionY: (exit.y + 0.5) * GRID_UNIT,
      width: GATE_WIDTH,
      depth: GATE_DEPTH,
      rotation: 0,
    })),
  ];

  const slots: ParkingMap3DSlot[] = layout.slots.map(slot => {
    // When canvas coordinates are available (from real API data via transformer),
    // use them directly for precise positioning with the group rotation.
    const hasCanvasCoords = typeof slot.canvasX === 'number' && typeof slot.canvasY === 'number';
    const slotRotation = typeof slot.rotation === 'number' ? slot.rotation : 0;

    let position2d: ParkingMap3DPoint;
    let renderRotation: number;
    let slotSize: { width: number; depth: number };

    if (hasCanvasCoords) {
      // Use original canvas pixel coordinates directly (not grid-converted)
      position2d = { x: slot.canvasX! * GRID_UNIT, y: slot.canvasY! * GRID_UNIT };
      renderRotation = slotRotation;
      const sw = slot.slotWidth !== undefined ? slot.slotWidth * GRID_UNIT : SLOT_LENGTH;
      const sh = slot.slotHeight !== undefined ? slot.slotHeight * GRID_UNIT : SLOT_THICKNESS;
      slotSize = { width: Math.max(sw, 20), depth: Math.max(sh, 20) };
    } else {
      // Fallback for mock data without canvas coordinates
      const orientation = getSlotOrientation(slotLookup, slot);
      position2d = {
        x: (slot.x + 0.5) * GRID_UNIT,
        y: (slot.y + 0.5) * GRID_UNIT,
      };
      renderRotation = orientation === 'horizontal' ? 0 : 90;
      slotSize = orientation === 'horizontal'
        ? { width: SLOT_LENGTH, depth: SLOT_THICKNESS }
        : { width: SLOT_THICKNESS, depth: SLOT_LENGTH };
    }

    return {
      id: slot.id,
      code: slot.code,
      label: `${slot.name || slot.code} (${slot.code})`,
      position2d,
      rotation: renderRotation,
      status: STATUS_PALETTE[slot.status] ?? 'empty',
      zoneName: slot.zone || 'Zone',
      groupCode: null,
      size: slotSize,
    };
  });

  const visualSlots = slots.map(slot => ({
    ...slot,
    size: getExpandedSlotSize(slot, slots),
  }));

  const bounds = getWorldBounds(layout, boundary, zones, lanes, gates, visualSlots);

  const stats = visualSlots.reduce(
    (result, slot) => {
      result.total += 1;
      result[slot.status] += 1;
      return result;
    },
    {
      total: 0,
      empty: 0,
      reserved: 0,
      occupied: 0,
    },
  );

  return {
    parkingLot: {
      name: layout.floorName || `Floor ${layout.floorLevel}`,
    },
    floor: {
      name: layout.floorName || `Floor ${layout.floorLevel}`,
      boundary,
    },
    bounds,
    zones,
    lanes,
    gates,
    slots: visualSlots,
    stats,
  };
};

export const buildParkingMap3DViewState = (
  selectedSlot: ParkingSlot | null,
  navigationPath: Position[] | null,
): ParkingMap3DViewState => ({
  selectedSlotId: selectedSlot?.id ?? null,
  route: (navigationPath ?? []).map(point => toWorldPoint(point.x + 0.5, point.y + 0.5)),
});







