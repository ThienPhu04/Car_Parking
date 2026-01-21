import { NavigationInstruction, NavigationRoute, ParkingCell, Position } from "@app-types/parking.types";

export class ParkingNavigator {
  private cells: ParkingCell[][];
  private width: number;
  private height: number;

  constructor(cells: ParkingCell[][]) {
    this.cells = cells;
    this.height = cells.length;
    this.width = cells[0]?.length || 0;
  }

  findPath(start: Position, end: Position): NavigationRoute | null {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, PathNode>();

    const startNode: PathNode = {
      position: start,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
      // Tìm node có f score thấp nhất
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.position.x},${current.position.y}`;

      // Đã đến đích
      if (current.position.x === end.x && current.position.y === end.y) {
        return this.reconstructPath(cameFrom, current, start);
      }

      closedSet.add(currentKey);

      // Kiểm tra các ô lân cận
      const neighbors = this.getNeighbors(current.position);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        const gScore = current.g + 1;
        const neighborNode: PathNode = {
          position: neighbor,
          g: gScore,
          h: this.heuristic(neighbor, end),
          f: 0,
        };
        neighborNode.f = neighborNode.g + neighborNode.h;

        const existingIndex = openSet.findIndex(
          n => n.position.x === neighbor.x && n.position.y === neighbor.y
        );

        if (existingIndex === -1) {
          openSet.push(neighborNode);
          cameFrom.set(neighborKey, current);
        } else if (gScore < openSet[existingIndex].g) {
          openSet[existingIndex] = neighborNode;
          cameFrom.set(neighborKey, current);
        }
      }
    }

    return null; // Không tìm thấy đường
  }

  private heuristic(a: Position, b: Position): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getNeighbors(pos: Position): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
    ];

    for (const dir of directions) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;

      if (this.isWalkable(newX, newY)) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  private isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    return this.cells[y][x].walkable;
  }

  private reconstructPath(
    cameFrom: Map<string, PathNode>,
    endNode: PathNode,
    start: Position
  ): NavigationRoute {
    const path: Position[] = [];
    let current = endNode;

    while (current.position.x !== start.x || current.position.y !== start.y) {
      path.unshift(current.position);
      const key = `${current.position.x},${current.position.y}`;
      const prev = cameFrom.get(key);
      if (!prev) break;
      current = prev;
    }
    path.unshift(start);

    // Tạo instructions
    const instructions = this.generateInstructions(path);

    // Tính khoảng cách (mỗi cell = 3m)
    const distance = (path.length - 1) * 3;
    // Ước tính thời gian (tốc độ đi bộ 1.4 m/s)
    const estimatedTime = Math.ceil(distance / 1.4);

    return {
      path,
      distance,
      estimatedTime,
      instructions,
    };
  }

  private generateInstructions(path: Position[]): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      const prev = i > 0 ? path[i - 1] : null;

      let direction: 'straight' | 'left' | 'right' = 'straight';
      let description = 'Đi thẳng';

      if (prev) {
        const prevDir = { x: current.x - prev.x, y: current.y - prev.y };
        const nextDir = { x: next.x - current.x, y: next.y - current.y };

        // Phát hiện rẽ trái/phải
        if (prevDir.x !== nextDir.x || prevDir.y !== nextDir.y) {
          const cross = prevDir.x * nextDir.y - prevDir.y * nextDir.x;
          if (cross > 0) {
            direction = 'right';
            description = 'Rẽ phải';
          } else if (cross < 0) {
            direction = 'left';
            description = 'Rẽ trái';
          }
        }
      }

      instructions.push({
        position: current,
        direction,
        description,
      });
    }

    return instructions;
  }
}

interface PathNode {
  position: Position;
  g: number;
  h: number;
  f: number;
}