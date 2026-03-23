import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, {
  Circle,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import {
  CellType,
  FloorLayout,
  ParkingCell,
  ParkingSlot,
  Position,
  SlotStatus,
} from '../../../types/parking.types';
import type { ZoneCell } from '../../../types/parking.types';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CELL  = 15;          // px per grid cell (slot size)
const PAD   = SPACING.sm;  // padding used for fit-to-screen calculation
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const clampJS = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// ─── ZONE COLOUR PALETTE ─────────────────────────────────────────────────────
// Colours are keyed by nameZone coming from the API.
// Unknown zones fall back to the DEFAULT entry.

const ZONE_PALETTE: Record<string, { fill: string; stroke: string; text: string }> = {
  'Khu vực A': { fill: 'rgba(255,150,190,0.28)', stroke: '#e0609a', text: '#8b1a4a' },
  'Khu A':   { fill: 'rgba(255,150,190,0.28)', stroke: '#e0609a', text: '#8b1a4a' },
  'Khu B':   { fill: 'rgba(200,185,120,0.38)', stroke: '#b8902a', text: '#6b5010' },
  'Khu C':   { fill: 'rgba(180,80,80,0.26)',   stroke: '#b04040', text: '#7f1d1d' },
  'New Zone': { fill: 'rgba(140,190,220,0.28)', stroke: '#5090b0', text: '#1e4060' },
  'Zone A':  { fill: 'rgba(255,150,190,0.28)', stroke: '#e0609a', text: '#8b1a4a' },
  'Zone B':  { fill: 'rgba(200,185,120,0.38)', stroke: '#b8902a', text: '#6b5010' },
  'Zone C':  { fill: 'rgba(180,80,80,0.26)',   stroke: '#b04040', text: '#7f1d1d' },
  DEFAULT:   { fill: 'rgba(140,190,220,0.28)', stroke: '#5090b0', text: '#1e4060' },
};

// ─── SLOT COLOUR ─────────────────────────────────────────────────────────────

const slotColor = (status: SlotStatus): string => {
  switch (status) {
    case SlotStatus.AVAILABLE: return COLORS.success;   // green
    case SlotStatus.RESERVED:  return COLORS.warning;   // yellow / orange
    case SlotStatus.OCCUPIED:  return COLORS.error;     // red
    default:                   return COLORS.textSecondary;
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Collect all unique zone metadata from the cells grid */
function collectZoneMeta(
  cells: ParkingCell[][],
): Array<{ code: string; name: string; minX: number; minY: number; maxX: number; maxY: number }> {
  const map = new Map<string, { code: string; name: string; minX: number; minY: number; maxX: number; maxY: number }>();

  cells.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell.type !== CellType.ZONE) return;
      const zc = cell as unknown as ZoneCell;
      const key = zc.zoneCode ?? zc.zoneName ?? `zone-${x}-${y}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { code: key, name: zc.zoneName ?? key, minX: x, minY: y, maxX: x, maxY: y });
      } else {
        existing.minX = Math.min(existing.minX, x);
        existing.minY = Math.min(existing.minY, y);
        existing.maxX = Math.max(existing.maxX, x);
        existing.maxY = Math.max(existing.maxY, y);
      }
    })
  );

  return Array.from(map.values());
}

// ─── PROPS ───────────────────────────────────────────────────────────────────

interface EnhancedParkingGridProps {
  layout: FloorLayout;
  selectedSlot: ParkingSlot | null;
  navigationPath: Position[] | null;
  onSlotPress: (slot: ParkingSlot) => void;
  onCellPress?: (x: number, y: number) => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export const EnhancedParkingGrid: React.FC<EnhancedParkingGridProps> = ({
  layout,
  selectedSlot,
  navigationPath,
  onSlotPress,
}) => {
  const svgW = layout.width  * CELL;
  const svgH = layout.height * CELL;

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const minZoom = useSharedValue(MIN_ZOOM);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;
    const fitScale = Math.min(
      (viewport.width - PAD * 2) / svgW,
      (viewport.height - PAD * 2) / svgH,
    );
    if (!Number.isFinite(fitScale) || fitScale <= 0) return;
    const initialScale = clampJS(fitScale, MIN_ZOOM, MAX_ZOOM);
    minZoom.value = MIN_ZOOM;
    const centeredX = (viewport.width - svgW * initialScale) / 2;
    const centeredY = (viewport.height - svgH * initialScale) / 2;
    scale.value = initialScale;
    startScale.value = initialScale;
    translateX.value = centeredX;
    translateY.value = centeredY;
    startTranslateX.value = centeredX;
    startTranslateY.value = centeredY;
  }, [
    viewport.width,
    viewport.height,
    svgW,
    svgH,
    minZoom,
    scale,
    startScale,
    translateX,
    translateY,
    startTranslateX,
    startTranslateY,
  ]);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate(e => {
      const nextScale = clamp(startScale.value * e.scale, minZoom.value, MAX_ZOOM);
      const ratio = nextScale / startScale.value;
      scale.value = nextScale;
      translateX.value = (1 - ratio) * e.focalX + ratio * startTranslateX.value;
      translateY.value = (1 - ratio) * e.focalY + ratio * startTranslateY.value;
    })
    .onEnd(() => {
      startScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate(e => {
      translateX.value = startTranslateX.value + e.translationX;
      translateY.value = startTranslateY.value + e.translationY;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const mapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Pre-compute zone bounding boxes once
  const zoneMeta = useMemo(() => collectZoneMeta(layout.cells), [layout.cells]);

  // ─── Lanes (actual road paths from API) ──────────────────────────────────────
  const renderLanes = () => {
    if (!layout.lanes || layout.lanes.length === 0) return null;

    return layout.lanes.map((lane, idx) => {
      if (!lane.points || lane.points.length < 2) return null;

      const d = lane.points
        .map((p, i) => {
          const px = p.x * CELL + CELL / 2;
          const py = p.y * CELL + CELL / 2;
          return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
        })
        .join(' ');

      const strokeWidth = Math.max(2, lane.laneWidth ?? CELL);

      return (
        <Path
          key={`lane-${lane.code ?? idx}`}
          d={d}
          stroke="rgba(148, 163, 184, 0.65)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  };

  // ── Zone background rectangles + border + label ──────────────────────────
  const renderZones = () => {
    if (layout.zones && layout.zones.length > 0) {
      return layout.zones.map(zone => {
        const palette = ZONE_PALETTE[zone.name] ?? ZONE_PALETTE.DEFAULT;
        const points = zone.points.map(p => ({ x: p.x * CELL, y: p.y * CELL }));
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));

        return (
          <G key={`zone-poly-${zone.code}`}>
            <Path d={d} fill={palette.fill} />
            <Path d={d} fill="none" stroke={palette.stroke} strokeWidth={1.5} />
            <Rect
              x={minX + 5}
              y={minY + 3}
              width={zone.name.length * 6.5 + 8}
              height={14}
              fill="rgba(248, 0, 0, 0.65)"
              rx={3}
              ry={3}
            />
            <SvgText
              x={minX + 8}
              y={minY + 13}
              fontSize={10}
              fontWeight="bold"
              fill={palette.text}
            >
              {zone.name}
            </SvgText>
          </G>
        );
      });
    }

    return zoneMeta.map(z => {
      const palette = ZONE_PALETTE[z.name] ?? ZONE_PALETTE.DEFAULT;
      const rx = z.minX * CELL;
      const ry = z.minY * CELL;
      const rw = (z.maxX - z.minX + 1) * CELL;
      const rh = (z.maxY - z.minY + 1) * CELL;

      return (
        <G key={`zone-${z.code}`}>
          <Rect x={rx} y={ry} width={rw} height={rh} fill={palette.fill} rx={5} ry={5} />
          <Rect
            x={rx}
            y={ry}
            width={rw}
            height={rh}
            fill="none"
            stroke={palette.stroke}
            strokeWidth={1.5}
            rx={5}
            ry={5}
          />
          <Rect
            x={rx + 5}
            y={ry + 3}
            width={z.name.length * 6.5 + 8}
            height={14}
            fill="rgba(248, 0, 0, 0.65)"
            rx={3}
            ry={3}
          />
          <SvgText
            x={rx + 8}
            y={ry + 13}
            fontSize={10}
            fontWeight="bold"
            fill={palette.text}
          >
            {z.name}
          </SvgText>
        </G>
      );
    });
  };

  // ── Individual cells ─────────────────────────────────────────────────────
  const renderCells = () =>
    layout.cells.flatMap((row, y) =>
      row.map((cell, x) => {
        const cx = x * CELL;
        const cy = y * CELL;

        switch (cell.type) {
          // ── ROAD ──────────────────────────────────────────────────────────
          case CellType.ROAD:
            return (
              <Rect
                key={`r-${x}-${y}`}
                x={cx} y={cy} width={CELL} height={CELL}
                fill="#ffffff"
              />
            );

          // ── WALL / ZONE (background already painted by renderZones) ───────
          case CellType.ZONE:
          case CellType.WALL:
            return (
              <Rect
                key={`r-${x}-${y}`}
                x={cx} y={cy} width={CELL} height={CELL}
                fill="#ffffff"
              />
            );

          // ── ENTRY ─────────────────────────────────────────────────────────
          case CellType.ENTRY:
            return (
              <G key={`entry-${x}-${y}`}>
                <Rect
                  x={cx} y={cy} width={CELL} height={CELL}
                  fill="#4ade80" rx={3} ry={3}
                />
                <SvgText
                  x={cx + CELL / 2} y={cy + CELL / 2 + 4}
                  fontSize={9} fontWeight="bold" fill="#fff"
                  textAnchor="middle"
                >
                  IN
                </SvgText>
              </G>
            );

          // ── EXIT ──────────────────────────────────────────────────────────
          case CellType.EXIT:
            return (
              <G key={`exit-${x}-${y}`}>
                <Rect
                  x={cx} y={cy} width={CELL} height={CELL}
                  fill="#f87171" rx={3} ry={3}
                />
                <SvgText
                  x={cx + CELL / 2} y={cy + CELL / 2 + 4}
                  fontSize={9} fontWeight="bold" fill="#fff"
                  textAnchor="middle"
                >
                  OUT
                </SvgText>
              </G>
            );

          // ── ELEVATOR ──────────────────────────────────────────────────────
          case CellType.ELEVATOR:
            return (
              <G key={`elev-${x}-${y}`}>
                <Rect x={cx} y={cy} width={CELL} height={CELL} fill="#FF9800" rx={3} />
                <SvgText x={cx + CELL / 2} y={cy + CELL / 2 + 5} fontSize={13} textAnchor="middle">🛗</SvgText>
              </G>
            );

          // ── STAIRS ────────────────────────────────────────────────────────
          case CellType.STAIRS:
            return (
              <G key={`stairs-${x}-${y}`}>
                <Rect x={cx} y={cy} width={CELL} height={CELL} fill="#9C27B0" rx={3} />
                <SvgText x={cx + CELL / 2} y={cy + CELL / 2 + 5} fontSize={13} textAnchor="middle">🪜</SvgText>
              </G>
            );

          // ── PARKING SLOT ──────────────────────────────────────────────────
          case CellType.SLOT: {
            const slot = cell as ParkingSlot;
            const isSelected =
              selectedSlot?.id === slot.id ||
              (selectedSlot?.x === x && selectedSlot?.y === y);
            const fill   = slotColor(slot.status);
            const pad    = 2;
            const inner  = CELL - pad * 2;

            return (
              <G
                key={`slot-${x}-${y}`}
                onPress={() => onSlotPress(slot)}
              >
                {/* Outer selection ring */}
                {isSelected && (
                  <Rect
                    x={cx - 2} y={cy - 2}
                    width={CELL + 4} height={CELL + 4}
                    fill="none"
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    rx={5} ry={5}
                  />
                )}

                {/* Slot body */}
                <Rect
                  x={cx + pad} y={cy + pad}
                  width={inner} height={inner}
                  fill={fill}
                  stroke={isSelected ? COLORS.primary : 'rgba(0,0,0,0.18)'}
                  strokeWidth={isSelected ? 2 : 0.8}
                  rx={4} ry={4}
                />

                {/* Shadow strip at bottom for 3-D feel */}
                <Rect
                  x={cx + pad} y={cy + CELL - pad - 4}
                  width={inner} height={4}
                  fill="rgba(0,0,0,0.12)"
                  rx={0} ry={0}
                />

                {/* Slot code label */}
                <SvgText
                  x={cx + CELL / 2}
                  y={cy + CELL / 2 + 3}
                  fontSize={7}
                  fontWeight="bold"
                  fill="#fff"
                  textAnchor="middle"
                >
                  {slot.code.replace(/[A-Za-z]+0*/, '').slice(0, 4) || slot.code.slice(-3)}
                </SvgText>

                {/* Sensor-real dot */}
                {slot.isSensorReal && (
                  <Circle
                    cx={cx + CELL - 6} cy={cy + 6}
                    r={2.5}
                    fill="rgba(255,255,255,0.85)"
                  />
                )}

                {/* Near-elevator feature dot */}
                {slot.features?.includes('near_elevator') && (
                  <Circle cx={cx + 6} cy={cy + 6} r={2.5} fill="#FF9800" />
                )}
                {/* EV charging dot */}
                {slot.features?.includes('ev_charging') && (
                  <Circle cx={cx + 6} cy={cy + 6} r={2.5} fill="#FFEB3B" />
                )}
              </G>
            );
          }

          default:
            return null;
        }
      })
    );

  // ── Navigation path ───────────────────────────────────────────────────────
  const renderNavPath = () => {
    if (!navigationPath || navigationPath.length < 2) return null;

    const d = navigationPath
      .map((p, i) => {
        const px = p.x * CELL + CELL / 2;
        const py = p.y * CELL + CELL / 2;
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');

    const start = navigationPath[0];
    const end   = navigationPath[navigationPath.length - 1];

    return (
      <G>
        {/* Dashed path line */}
        <Path
          d={d}
          stroke={COLORS.primary}
          strokeWidth={4}
          fill="none"
          strokeDasharray="9,5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start dot — green */}
        <Circle
          cx={start.x * CELL + CELL / 2}
          cy={start.y * CELL + CELL / 2}
          r={8} fill="#4CAF50" stroke="#fff" strokeWidth={2}
        />

        {/* End dot — red/orange */}
        <Circle
          cx={end.x * CELL + CELL / 2}
          cy={end.y * CELL + CELL / 2}
          r={8} fill="#FF5722" stroke="#fff" strokeWidth={2}
        />

        {/* Direction arrows every 3 cells */}
        {navigationPath.map((pos, i) => {
          if (i === 0 || i === navigationPath.length - 1) return null;
          if (i % 3 !== 0) return null;

          const prev  = navigationPath[i - 1];
          const angle = Math.atan2(pos.y - prev.y, pos.x - prev.x) * (180 / Math.PI);
          const ax    = pos.x * CELL + CELL / 2;
          const ay    = pos.y * CELL + CELL / 2;

          return (
            <G key={`arrow-${i}`} transform={`translate(${ax},${ay}) rotate(${angle})`}>
              <Path d="M -6,-5 L 7,0 L -6,5 Z" fill={COLORS.primary} />
            </G>
          );
        })}
      </G>
    );
  };

  // ── Outer corner dots (matching screenshot decoration) ────────────────────
  const renderCornerDots = () => {
    const dots = [
      { cx: 0,    cy: 0    },
      { cx: svgW, cy: 0    },
      { cx: 0,    cy: svgH },
      { cx: svgW, cy: svgH },
    ];
    return dots.map((d, i) => (
      <Circle key={`dot-${i}`} cx={d.cx} cy={d.cy} r={5} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1.5} />
    ));
  };

  return (
    <View
      style={styles.container}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        if (width === viewport.width && height === viewport.height) return;
        setViewport({ width, height });
      }}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.svgContainer, { width: svgW, height: svgH }, mapStyle]}>
          <Svg width={svgW} height={svgH}>
          {/* 1. Road cells first (below everything) */}
          {renderCells()}

          {/* 2. Lanes (road paths) */}
          {renderLanes()}

          {/* 3. Zone coloured backgrounds + borders + labels */}
          {renderZones()}

          {/* 4. Re-render slot cells ON TOP of zone backgrounds */}
          {layout.cells.flatMap((row, y) =>
            row.map((cell, x) => {
              if (cell.type !== CellType.SLOT) return null;
              const slot      = cell as ParkingSlot;
              const cx        = x * CELL;
              const cy        = y * CELL;
              const isSelected =
                selectedSlot?.id === slot.id ||
                (selectedSlot?.x === x && selectedSlot?.y === y);
              const fill = slotColor(slot.status);
              const pad  = 2;
              const inner = CELL - pad * 2;

              return (
                <G key={`slot-top-${x}-${y}`} onPress={() => onSlotPress(slot)}>
                  {isSelected && (
                    <Rect
                      x={cx - 2} y={cy - 2}
                      width={CELL + 4} height={CELL + 4}
                      fill="none"
                      stroke={COLORS.primary}
                      strokeWidth={2.5}
                      rx={5} ry={5}
                    />
                  )}
                  <Rect
                    x={cx + pad} y={cy + pad}
                    width={inner} height={inner}
                    fill={fill}
                    stroke={isSelected ? COLORS.primary : 'rgba(0,0,0,0.18)'}
                    strokeWidth={isSelected ? 2 : 0.8}
                    rx={4} ry={4}
                  />
                  <Rect
                    x={cx + pad} y={cy + CELL - pad - 4}
                    width={inner} height={4}
                    fill="rgba(0,0,0,0.12)"
                  />
                  <SvgText
                    x={cx + CELL / 2}
                    y={cy + CELL / 2 + 3}
                    fontSize={7} fontWeight="bold"
                    fill="#ca0c0c" textAnchor="middle"
                  >
                    {slot.code.replace(/[A-Za-z]+0*/, '').slice(0, 4) || slot.code.slice(-3)}
                  </SvgText>
                  {slot.isSensorReal && (
                    <Circle cx={cx + CELL - 6} cy={cy + 6} r={2.5} fill="rgba(255,255,255,0.85)" />
                  )}
                </G>
              );
            })
          )}

          {/* 5. Entry / Exit markers on top */}
          {layout.entries.map(e => (
            <G key={`entry-top-${e.id}`}>
              <Rect x={e.x * CELL} y={e.y * CELL} width={CELL} height={CELL} fill="#4ade80" rx={3} />
              <SvgText x={e.x * CELL + CELL / 2} y={e.y * CELL + CELL / 2 + 4} fontSize={9} fontWeight="bold" fill="#fff" textAnchor="middle">IN</SvgText>
            </G>
          ))}
          {layout.exits.map(e => (
            <G key={`exit-top-${e.id}`}>
              <Rect x={e.x * CELL} y={e.y * CELL} width={CELL} height={CELL} fill="#f87171" rx={3} />
              <SvgText x={e.x * CELL + CELL / 2} y={e.y * CELL + CELL / 2 + 4} fontSize={9} fontWeight="bold" fill="#fff" textAnchor="middle">OUT</SvgText>
            </G>
          ))}

          {/* 6. Navigation path on very top */}
          {renderNavPath()}

          {/* 7. Corner dots */}
          {renderCornerDots()}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  svgContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});

