import {
  ParkingCell,
  Position,
  NavigationRoute,
  NavigationInstruction,
  CellType,
} from '../../../types/parking.types';

interface PathNode {
  position: Position;
  g: number;
  h: number;
  f: number;
}

export class ParkingNavigator {
  private cells: ParkingCell[][];
  private height: number;
  private width: number;

  constructor(cells: ParkingCell[][]) {
    this.cells  = cells;
    this.height = cells.length;
    this.width  = cells[0]?.length ?? 0;
  }

  // ─── A* ────────────────────────────────────────────────────────────────────

  findPath(start: Position, end: Position): NavigationRoute | null {
    const openSet: PathNode[] = [];
    const closedSet           = new Set<string>();
    const cameFrom            = new Map<string, PathNode>();

    const startNode: PathNode = {
      position: start,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current    = openSet.shift()!;
      const currentKey = this.key(current.position);

      if (current.position.x === end.x && current.position.y === end.y) {
        return this.buildRoute(cameFrom, current, start);
      }

      closedSet.add(currentKey);

      for (const neighbour of this.neighbours(current.position)) {
        const nKey = this.key(neighbour);
        if (closedSet.has(nKey)) continue;

        const g: number  = current.g + 1;
        const node: PathNode = {
          position: neighbour,
          g,
          h: this.heuristic(neighbour, end),
          f: 0,
        };
        node.f = node.g + node.h;

        const existing = openSet.findIndex(n => n.position.x === neighbour.x && n.position.y === neighbour.y);
        if (existing === -1) {
          openSet.push(node);
          cameFrom.set(nKey, current);
        } else if (g < openSet[existing].g) {
          openSet[existing] = node;
          cameFrom.set(nKey, current);
        }
      }
    }

    return null; // no path found
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private key(p: Position): string {
    return `${p.x},${p.y}`;
  }

  private heuristic(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private neighbours(pos: Position): Position[] {
    return [
      { x: pos.x,     y: pos.y - 1 },
      { x: pos.x + 1, y: pos.y     },
      { x: pos.x,     y: pos.y + 1 },
      { x: pos.x - 1, y: pos.y     },
    ].filter(p => this.walkable(p.x, p.y));
  }

  private walkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.cells[y][x].walkable;
  }

  private buildRoute(
    cameFrom: Map<string, PathNode>,
    endNode: PathNode,
    start: Position,
  ): NavigationRoute {
    const path: Position[] = [];
    let current: PathNode  = endNode;

    while (current.position.x !== start.x || current.position.y !== start.y) {
      path.unshift(current.position);
      const prev = cameFrom.get(this.key(current.position));
      if (!prev) break;
      current = prev;
    }
    path.unshift(start);

    const distance      = (path.length - 1) * 3;      // 1 cell ≈ 3 m
    const estimatedTime = Math.ceil(distance / 1.4);   // walking 1.4 m/s

    return {
      path,
      distance,
      estimatedTime,
      instructions: this.buildInstructions(path),
    };
  }

  private buildInstructions(path: Position[]): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const curr = path[i];
      const next = path[i + 1];
      const prev = i > 0 ? path[i - 1] : null;

      let direction: 'straight' | 'left' | 'right' = 'straight';
      let description = 'Đi thẳng';

      if (prev) {
        const pd = { x: curr.x - prev.x, y: curr.y - prev.y };
        const nd = { x: next.x - curr.x, y: next.y - curr.y };
        if (pd.x !== nd.x || pd.y !== nd.y) {
          const cross = pd.x * nd.y - pd.y * nd.x;
          if (cross > 0)      { direction = 'right'; description = 'Rẽ phải'; }
          else if (cross < 0) { direction = 'left';  description = 'Rẽ trái'; }
        }
      }

      instructions.push({ position: curr, direction, description });
    }

    return instructions;
  }
}