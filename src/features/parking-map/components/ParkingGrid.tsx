import { CellType, FloorLayout, ParkingSlot, Position, SlotStatus } from "@app-types/parking.types";
import { COLORS } from "@shared/constants/colors";
import { SPACING } from "@shared/constants/spacing";
import React from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import Svg, { Path, Circle, Rect, Text as SvgText, G, Defs, Marker } from 'react-native-svg';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = 30;
const MARGIN = SPACING.md;

interface ParkingGridProps {
  layout: FloorLayout;
  selectedSlot: ParkingSlot | null;
  navigationPath: Position[] | null;
  onSlotPress: (slot: ParkingSlot) => void;
  onCellPress?: (x: number, y: number) => void;
}

export const ParkingGrid: React.FC<ParkingGridProps> = ({
  layout,
  selectedSlot,
  navigationPath,
  onSlotPress,
  onCellPress,
}) => {
  const gridWidth = layout.width * CELL_SIZE;
  const gridHeight = layout.height * CELL_SIZE;

  const getCellColor = (cell: any): string => {
    if (!cell) return COLORS.background;

    switch (cell.type) {
      case CellType.SLOT:
        if (cell.status === SlotStatus.AVAILABLE) return COLORS.success;
        if (cell.status === SlotStatus.OCCUPIED) return COLORS.error;
        if (cell.status === SlotStatus.RESERVED) return COLORS.warning;
        return COLORS.textSecondary;
      case CellType.ROAD:
        return '#E0E0E0';
      case CellType.ENTRY:
        return '#4CAF50';
      case CellType.EXIT:
        return '#2196F3';
      case CellType.WALL:
        return '#9E9E9E';
      default:
        return COLORS.background;
    }
  };

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
        {/* Đường dẫn chính */}
        <Path
          d={pathString}
          stroke={COLORS.primary}
          strokeWidth={4}
          fill="none"
          strokeDasharray="8,4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Điểm bắt đầu */}
        <Circle
          cx={navigationPath[0].x * CELL_SIZE + CELL_SIZE / 2}
          cy={navigationPath[0].y * CELL_SIZE + CELL_SIZE / 2}
          r={8}
          fill="#4CAF50"
          stroke="white"
          strokeWidth={2}
        />

        {/* Điểm kết thúc */}
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
                d="M -5,-5 L 5,0 L -5,5 Z"
                fill={COLORS.primary}
              />
            </G>
          );
        })}
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
          {/* Vẽ grid */}
          {layout.cells.map((row, y) =>
            row.map((cell, x) => {
              const isSelected = selectedSlot && selectedSlot.x === x && selectedSlot.y === y;

              return (
                <G key={`cell-${x}-${y}`}>
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

                  {/* Label cho slots */}
                  {cell.type === CellType.SLOT && (
                    <SvgText
                      x={x * CELL_SIZE + CELL_SIZE / 2}
                      y={y * CELL_SIZE + CELL_SIZE / 2 + 4}
                      fontSize={8}
                      fontWeight="bold"
                      fill="white"
                      textAnchor="middle"
                    >
                      {(cell as ParkingSlot).code}
                    </SvgText>
                  )}

                  {/* Icon cho Entry/Exit */}
                  {cell.type === CellType.ENTRY && (
                    <SvgText
                      x={x * CELL_SIZE + CELL_SIZE / 2}
                      y={y * CELL_SIZE + CELL_SIZE / 2 + 5}
                      fontSize={16}
                      textAnchor="middle"
                    >
                      ⬇️
                    </SvgText>
                  )}

                  {cell.type === CellType.EXIT && (
                    <SvgText
                      x={x * CELL_SIZE + CELL_SIZE / 2}
                      y={y * CELL_SIZE + CELL_SIZE / 2 + 5}
                      fontSize={16}
                      textAnchor="middle"
                    >
                      ⬆️
                    </SvgText>
                  )}
                </G>
              );
            })
          )}

          {/* Vẽ đường dẫn navigation */}
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