import { FloorLayout, ParkingSlot, Position, ParkingCell, CellType, SlotStatus } from "@app-types/parking.types";
import { COLORS } from "@shared/constants/colors";
import { SPACING } from "@shared/constants/spacing";
import React from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import Svg, { G, Path, Rect, Circle, Text as SvgText } from "react-native-svg";


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = 30;
const MARGIN = SPACING.md;

interface EnhancedParkingGridProps {
  layout: FloorLayout;
  selectedSlot: ParkingSlot | null;
  navigationPath: Position[] | null;
  onSlotPress: (slot: ParkingSlot) => void;
  onCellPress?: (x: number, y: number) => void;
}

export const EnhancedParkingGrid: React.FC<EnhancedParkingGridProps> = ({
  layout,
  selectedSlot,
  navigationPath,
  onSlotPress,
  onCellPress,
}) => {
  const gridWidth = layout.width * CELL_SIZE;
  const gridHeight = layout.height * CELL_SIZE;

  /**
   * Get cell color based on type and status
   */
  const getCellColor = (cell: ParkingCell): string => {
    if (!cell) return COLORS.background;

    switch (cell.type) {
      case CellType.SLOT:
        const slot = cell as ParkingSlot;
        switch (slot.status) {
          case SlotStatus.AVAILABLE:
            return COLORS.success;
          case SlotStatus.RESERVED:
            return COLORS.warning;
          case SlotStatus.OCCUPIED:
            return COLORS.error;
          default:
            return COLORS.textSecondary;
        }
      case CellType.ROAD:
        return '#E0E0E0';
      case CellType.ENTRY:
        return '#4CAF50';
      case CellType.EXIT:
        return '#2196F3';
      case CellType.WALL:
        return '#9E9E9E';
      case CellType.ELEVATOR:
        return '#FF9800';
      case CellType.STAIRS:
        return '#9C27B0';
      default:
        return COLORS.background;
    }
  };

  /**
   * Get status text for tooltip
   */
  const getStatusText = (status: SlotStatus): string => {
    switch (status) {
      case SlotStatus.AVAILABLE:
        return 'Trống';
      case SlotStatus.RESERVED:
        return 'Đã đặt';
      case SlotStatus.OCCUPIED:
        return 'Đã có xe';
      default:
        return '';
    }
  };

  /**
   * Render navigation path với SVG
   */
  const renderNavigationPath = () => {
    if (!navigationPath || navigationPath.length < 2) return null;

    // Tạo SVG path string
    const pathString = navigationPath
      .map((pos, index) => {
        const x = pos.x * CELL_SIZE + CELL_SIZE / 2;
        const y = pos.y * CELL_SIZE + CELL_SIZE / 2;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <G>
        {/* Đường dẫn chính - animated dashed line */}
        <Path
          d={pathString}
          stroke={COLORS.primary}
          strokeWidth={4}
          fill="none"
          strokeDasharray="8,4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Điểm bắt đầu - Entry point */}
        <Circle
          cx={navigationPath[0].x * CELL_SIZE + CELL_SIZE / 2}
          cy={navigationPath[0].y * CELL_SIZE + CELL_SIZE / 2}
          r={8}
          fill="#4CAF50"
          stroke="white"
          strokeWidth={2}
        />

        {/* Điểm kết thúc - Destination slot */}
        <Circle
          cx={navigationPath[navigationPath.length - 1].x * CELL_SIZE + CELL_SIZE / 2}
          cy={navigationPath[navigationPath.length - 1].y * CELL_SIZE + CELL_SIZE / 2}
          r={8}
          fill="#FF5722"
          stroke="white"
          strokeWidth={2}
        />

        {/* Mũi tên chỉ hướng */}
        {navigationPath.map((pos, index) => {
          if (index === 0 || index === navigationPath.length - 1) return null;
          if (index % 3 !== 0) return null; // Chỉ hiện mỗi 3 điểm

          const prev = navigationPath[index - 1];
          const angle = Math.atan2(pos.y - prev.y, pos.x - prev.x) * (180 / Math.PI);

          return (
            <G
              key={`arrow-${index}`}
              transform={`translate(${pos.x * CELL_SIZE + CELL_SIZE / 2}, ${pos.y * CELL_SIZE + CELL_SIZE / 2}) rotate(${angle})`}
            >
              <Path
                d="M -6,-6 L 6,0 L -6,6 Z"
                fill={COLORS.primary}
              />
            </G>
          );
        })}
      </G>
    );
  };

  /**
   * Render single cell
   */
  const renderCell = (cell: ParkingCell, x: number, y: number) => {
    const isSelected = selectedSlot && 
                       cell.type === CellType.SLOT && 
                       (cell as ParkingSlot).id === selectedSlot.id;

    return (
      <G key={`cell-${x}-${y}`}>
        {/* Cell background */}
        <Rect
          x={x * CELL_SIZE}
          y={y * CELL_SIZE}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={getCellColor(cell)}
          stroke={isSelected ? COLORS.primary : '#BDBDBD'}
          strokeWidth={isSelected ? 3 : 0.5}
          onPress={() => {
            if (cell.type === CellType.SLOT) {
              onSlotPress(cell as ParkingSlot);
            } else if (onCellPress) {
              onCellPress(x, y);
            }
          }}
        />

        {/* Slot code label */}
        {cell.type === CellType.SLOT && (
          <SvgText
            x={x * CELL_SIZE + CELL_SIZE / 2}
            y={y * CELL_SIZE + CELL_SIZE / 2 + 3}
            fontSize={7}
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            {(cell as ParkingSlot).code.split('-').pop() || ''}
          </SvgText>
        )}

        {/* Entry icon */}
        {cell.type === CellType.ENTRY && (
          <SvgText
            x={x * CELL_SIZE + CELL_SIZE / 2}
            y={y * CELL_SIZE + CELL_SIZE / 2 + 5}
            fontSize={14}
            textAnchor="middle"
          >
            ⬇️
          </SvgText>
        )}

        {/* Exit icon */}
        {cell.type === CellType.EXIT && (
          <SvgText
            x={x * CELL_SIZE + CELL_SIZE / 2}
            y={y * CELL_SIZE + CELL_SIZE / 2 + 5}
            fontSize={14}
            textAnchor="middle"
          >
            ⬆️
          </SvgText>
        )}

        {/* Elevator icon */}
        {cell.type === CellType.ELEVATOR && (
          <SvgText
            x={x * CELL_SIZE + CELL_SIZE / 2}
            y={y * CELL_SIZE + CELL_SIZE / 2 + 4}
            fontSize={10}
            textAnchor="middle"
          >
            🛗
          </SvgText>
        )}

        {/* Stairs icon */}
        {cell.type === CellType.STAIRS && (
          <SvgText
            x={x * CELL_SIZE + CELL_SIZE / 2}
            y={y * CELL_SIZE + CELL_SIZE / 2 + 4}
            fontSize={10}
            textAnchor="middle"
          >
            🪜
          </SvgText>
        )}

        {/* Features indicator */}
        {cell.type === CellType.SLOT && (cell as ParkingSlot).features && (
          <G>
            {(cell as ParkingSlot).features!.includes('near_elevator') && (
              <Circle
                cx={x * CELL_SIZE + 5}
                cy={y * CELL_SIZE + 5}
                r={3}
                fill="#FF9800"
              />
            )}
            {(cell as ParkingSlot).features!.includes('ev_charging') && (
              <Circle
                cx={x * CELL_SIZE + CELL_SIZE - 5}
                cy={y * CELL_SIZE + 5}
                r={3}
                fill="#FFEB3B"
              />
            )}
          </G>
        )}
      </G>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollVertical}
      >
        <Svg width={gridWidth} height={gridHeight}>
          {/* Render all cells */}
          {layout.cells.map((row, y) =>
            row.map((cell, x) => renderCell(cell, x, y))
          )}

          {/* Render navigation path on top */}
          {renderNavigationPath()}
        </Svg>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: MARGIN,
  },
  scrollVertical: {
    paddingBottom: SPACING.xl,
  },
});