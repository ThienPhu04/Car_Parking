import { Position } from "@app-types/parking.types";

export const generatePath = (
  start: Position,
  end: Position,
  cellSize: number,
) => {
  const points = [];

  // Đi ngang trước
  points.push({
    x: start.x * cellSize,
    y: start.y * cellSize,
  });

  points.push({
    x: end.x * cellSize,
    y: start.y * cellSize,
  });

  // Rẽ xuống
  points.push({
    x: end.x * cellSize,
    y: end.y * cellSize,
  });

  return points;
};
