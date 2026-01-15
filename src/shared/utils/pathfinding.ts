import { PathNode } from "../../types/navigation.types";
import { Position } from "../../types/parking.types";

interface Node extends Position {
  f: number;
  g: number;
  h: number;
  parent?: Node;
}

export class PathFinder {
  private grid: number[][];
  private rows: number;
  private cols: number;

  constructor(grid: number[][]) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0]?.length || 0;
  }

  // A* Algorithm
  findPath(start: Position, end: Position): PathNode[] {
    const openList: Node[] = [];
    const closedList: Set<string> = new Set();

    const startNode: Node = {
      ...start,
      f: 0,
      g: 0,
      h: this.heuristic(start, end),
    };

    openList.push(startNode);

    while (openList.length > 0) {
      // Find node with lowest f score
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      // Goal reached
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current);
      }

      closedList.add(`${current.x},${current.y}`);

      // Check neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedList.has(key)) continue;

        const gScore = current.g + 1;
        const existing = openList.find(
          n => n.x === neighbor.x && n.y === neighbor.y
        );

        if (!existing) {
          const hScore = this.heuristic(neighbor, end);
          const node: Node = {
            ...neighbor,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current,
          };
          openList.push(node);
        } else if (gScore < existing.g) {
          existing.g = gScore;
          existing.f = gScore + existing.h;
          existing.parent = current;
        }
      }
    }

    return []; // No path found
  }

  private heuristic(a: Position, b: Position): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getNeighbors(node: Node): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
    ];

    for (const dir of directions) {
      const x = node.x + dir.x;
      const y = node.y + dir.y;

      if (this.isValid(x, y)) {
        neighbors.push({ x, y });
      }
    }

    return neighbors;
  }

  private isValid(x: number, y: number): boolean {
    return (
      x >= 0 &&
      x < this.cols &&
      y >= 0 &&
      y < this.rows &&
      this.grid[y][x] === 0 // 0 = walkable, 1 = obstacle
    );
  }

  private reconstructPath(node: Node): PathNode[] {
    const path: PathNode[] = [];
    let current: Node | undefined = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }
}