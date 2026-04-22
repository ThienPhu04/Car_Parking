import {
  EntryPoint,
  FloorLayout,
  NavigationInstruction,
  NavigationRoute,
  ParkingSlot,
  Position,
} from '../../../types/parking.types';

type RouteDirection = NavigationInstruction['direction'];

interface LaneSegment {
  laneIndex: number;
  segmentIndex: number;
  start: Position;
  end: Position;
}

interface SegmentPoint {
  point: Position;
  t: number;
}

interface ProjectionResult {
  point: Position;
  segment: LaneSegment;
  distance: number;
  t: number;
}

interface Edge {
  to: string;
  distance: number;
}

const GRID_METERS = 3;
const POINT_EPSILON = 1e-3;

const roundCoord = (value: number) => Number(value.toFixed(3));

const toNodeId = (point: Position) => `${roundCoord(point.x)},${roundCoord(point.y)}`;

const normalizedPoint = (point: Position): Position => ({
  x: roundCoord(point.x),
  y: roundCoord(point.y),
});

const arePointsEqual = (first: Position, second: Position, epsilon = POINT_EPSILON) =>
  Math.abs(first.x - second.x) <= epsilon && Math.abs(first.y - second.y) <= epsilon;

const distanceBetween = (first: Position, second: Position) =>
  Math.hypot(second.x - first.x, second.y - first.y);

const dotProduct = (first: Position, second: Position) => first.x * second.x + first.y * second.y;

const crossProduct = (first: Position, second: Position) => first.x * second.y - first.y * second.x;

const addUniquePoint = (points: SegmentPoint[], candidate: SegmentPoint) => {
  if (points.some(point => arePointsEqual(point.point, candidate.point) || Math.abs(point.t - candidate.t) < POINT_EPSILON)) {
    return;
  }

  points.push({
    point: normalizedPoint(candidate.point),
    t: candidate.t,
  });
};

const removeDuplicateSequentialPoints = (points: Position[]) =>
  points.reduce<Position[]>((result, point) => {
    const normalized = normalizedPoint(point);
    const previous = result[result.length - 1];

    if (!previous || !arePointsEqual(previous, normalized)) {
      result.push(normalized);
    }

    return result;
  }, []);

const projectPointToSegment = (point: Position, segmentStart: Position, segmentEnd: Position): SegmentPoint => {
  const segmentVector = {
    x: segmentEnd.x - segmentStart.x,
    y: segmentEnd.y - segmentStart.y,
  };
  const pointVector = {
    x: point.x - segmentStart.x,
    y: point.y - segmentStart.y,
  };
  const segmentLengthSquared = dotProduct(segmentVector, segmentVector);

  if (segmentLengthSquared <= POINT_EPSILON) {
    return {
      point: normalizedPoint(segmentStart),
      t: 0,
    };
  }

  const t = Math.max(0, Math.min(1, dotProduct(pointVector, segmentVector) / segmentLengthSquared));
  return {
    point: normalizedPoint({
      x: segmentStart.x + segmentVector.x * t,
      y: segmentStart.y + segmentVector.y * t,
    }),
    t,
  };
};

const pointToSegmentDistance = (point: Position, start: Position, end: Position) =>
  distanceBetween(point, projectPointToSegment(point, start, end).point);

const getLineIntersection = (
  firstStart: Position,
  firstEnd: Position,
  secondStart: Position,
  secondEnd: Position,
): SegmentPoint | null => {
  const r = { x: firstEnd.x - firstStart.x, y: firstEnd.y - firstStart.y };
  const s = { x: secondEnd.x - secondStart.x, y: secondEnd.y - secondStart.y };
  const denominator = crossProduct(r, s);
  const startDelta = { x: secondStart.x - firstStart.x, y: secondStart.y - firstStart.y };

  if (Math.abs(denominator) <= POINT_EPSILON) {
    return null;
  }

  const t = crossProduct(startDelta, s) / denominator;
  const u = crossProduct(startDelta, r) / denominator;

  if (t < -POINT_EPSILON || t > 1 + POINT_EPSILON || u < -POINT_EPSILON || u > 1 + POINT_EPSILON) {
    return null;
  }

  return {
    point: normalizedPoint({
      x: firstStart.x + r.x * t,
      y: firstStart.y + r.y * t,
    }),
    t: Math.max(0, Math.min(1, t)),
  };
};

const getSlotCenter = (slot: ParkingSlot): Position => ({
  x: typeof slot.canvasX === 'number' ? slot.canvasX : slot.x + 0.5,
  y: typeof slot.canvasY === 'number' ? slot.canvasY : slot.y + 0.5,
});

const getClosestPointOnPolygonBoundary = (polygon: Position[], target: Position): Position | null => {
  if (polygon.length < 2) {
    return null;
  }

  let bestPoint: Position | null = null;
  let minimumDistance = Infinity;

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const projected = projectPointToSegment(target, start, end).point;
    const distance = distanceBetween(projected, target);

    if (distance < minimumDistance) {
      minimumDistance = distance;
      bestPoint = projected;
    }
  }

  return bestPoint ? normalizedPoint(bestPoint) : null;
};

const getDirectionFromVectors = (previous: Position, current: Position, next: Position): RouteDirection => {
  const inVector = {
    x: current.x - previous.x,
    y: current.y - previous.y,
  };
  const outVector = {
    x: next.x - current.x,
    y: next.y - current.y,
  };
  const cross = crossProduct(inVector, outVector);

  if (Math.abs(cross) <= 0.02) {
    return 'straight';
  }

  return cross > 0 ? 'right' : 'left';
};

export class ParkingNavigator {
  private layout: FloorLayout;

  constructor(layout: FloorLayout) {
    this.layout = layout;
  }

  findPathFromEntryToSlot(entry: EntryPoint, slot: ParkingSlot): NavigationRoute | null {
    const laneSegments = this.buildLaneSegments();
    if (laneSegments.length === 0) {
      return null;
    }

    const entryPoint = normalizedPoint({ x: entry.x + 0.5, y: entry.y + 0.5 });
    const slotCenter = normalizedPoint(getSlotCenter(slot));
    const destination = this.resolveDestinationPoint(slot, slotCenter);

    const startProjection = this.findClosestProjection(entryPoint, laneSegments);
    const endProjection = this.findClosestProjection(destination, laneSegments);

    if (!startProjection || !endProjection) {
      return null;
    }

    const lanePath = this.findShortestLanePath(laneSegments, startProjection, endProjection);
    if (!lanePath) {
      return null;
    }

    const path = removeDuplicateSequentialPoints([
      entryPoint,
      startProjection.point,
      ...lanePath,
      endProjection.point,
      destination,
    ]);

    if (path.length < 2) {
      return null;
    }

    const distance = path.reduce((total, point, index) => {
      if (index === 0) {
        return total;
      }

      return total + distanceBetween(path[index - 1], point);
    }, 0) * GRID_METERS;

    return {
      path,
      distance: Math.round(distance),
      estimatedTime: Math.max(1, Math.ceil(distance / 1.4)),
      instructions: this.buildInstructions(path),
    };
  }

  private resolveDestinationPoint(slot: ParkingSlot, slotCenter: Position): Position {
    const zone = this.layout.zones?.find(candidate =>
      candidate.name === slot.zone || candidate.code === slot.zone,
    );

    if (!zone?.points?.length) {
      return slotCenter;
    }

    return getClosestPointOnPolygonBoundary(zone.points, slotCenter) ?? slotCenter;
  }

  private buildLaneSegments(): LaneSegment[] {
    const segments: LaneSegment[] = [];

    (this.layout.lanes ?? []).forEach((lane, laneIndex) => {
      const points = lane.points ?? [];
      for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex += 1) {
        const start = normalizedPoint(points[segmentIndex]);
        const end = normalizedPoint(points[segmentIndex + 1]);

        if (distanceBetween(start, end) <= POINT_EPSILON) {
          continue;
        }

        segments.push({
          laneIndex,
          segmentIndex,
          start,
          end,
        });
      }
    });

    return segments;
  }

  private findClosestProjection(point: Position, segments: LaneSegment[]): ProjectionResult | null {
    let best: ProjectionResult | null = null;

    segments.forEach(segment => {
      const projection = projectPointToSegment(point, segment.start, segment.end);
      const distance = distanceBetween(point, projection.point);

      if (!best || distance < best.distance) {
        best = {
          point: projection.point,
          segment,
          distance,
          t: projection.t,
        };
      }
    });

    return best;
  }

  private findShortestLanePath(
    segments: LaneSegment[],
    startProjection: ProjectionResult,
    endProjection: ProjectionResult,
  ): Position[] | null {
    const splitPointsBySegment = new Map<string, SegmentPoint[]>();

    segments.forEach(segment => {
      splitPointsBySegment.set(this.segmentKey(segment), [
        { point: segment.start, t: 0 },
        { point: segment.end, t: 1 },
      ]);
    });

    segments.forEach((segment, index) => {
      for (let compareIndex = index + 1; compareIndex < segments.length; compareIndex += 1) {
        const otherSegment = segments[compareIndex];
        const intersection = getLineIntersection(
          segment.start,
          segment.end,
          otherSegment.start,
          otherSegment.end,
        );

        if (!intersection) {
          continue;
        }

        const otherProjection = projectPointToSegment(intersection.point, otherSegment.start, otherSegment.end);
        addUniquePoint(splitPointsBySegment.get(this.segmentKey(segment))!, intersection);
        addUniquePoint(splitPointsBySegment.get(this.segmentKey(otherSegment))!, {
          point: otherProjection.point,
          t: otherProjection.t,
        });
      }
    });

    addUniquePoint(splitPointsBySegment.get(this.segmentKey(startProjection.segment))!, {
      point: startProjection.point,
      t: startProjection.t,
    });
    addUniquePoint(splitPointsBySegment.get(this.segmentKey(endProjection.segment))!, {
      point: endProjection.point,
      t: endProjection.t,
    });

    const graph = new Map<string, Edge[]>();
    const nodeLookup = new Map<string, Position>();

    segments.forEach(segment => {
      const segmentKey = this.segmentKey(segment);
      const segmentPoints = (splitPointsBySegment.get(segmentKey) ?? [])
        .sort((first, second) => first.t - second.t);

      for (let index = 0; index < segmentPoints.length - 1; index += 1) {
        const fromPoint = normalizedPoint(segmentPoints[index].point);
        const toPoint = normalizedPoint(segmentPoints[index + 1].point);
        const length = distanceBetween(fromPoint, toPoint);

        if (length <= POINT_EPSILON) {
          continue;
        }

        this.addGraphEdge(graph, nodeLookup, fromPoint, toPoint, length);
        this.addGraphEdge(graph, nodeLookup, toPoint, fromPoint, length);
      }
    });

    return this.runDijkstra(graph, nodeLookup, startProjection.point, endProjection.point);
  }

  private runDijkstra(
    graph: Map<string, Edge[]>,
    nodeLookup: Map<string, Position>,
    start: Position,
    end: Position,
  ): Position[] | null {
    const startId = toNodeId(start);
    const endId = toNodeId(end);
    const distances = new Map<string, number>([[startId, 0]]);
    const previous = new Map<string, string | null>([[startId, null]]);
    const queue = new Set<string>(graph.keys());

    if (!queue.has(startId) || !queue.has(endId)) {
      return null;
    }

    while (queue.size > 0) {
      let currentId: string | null = null;
      let currentDistance = Infinity;

      queue.forEach(nodeId => {
        const nodeDistance = distances.get(nodeId) ?? Infinity;
        if (nodeDistance < currentDistance) {
          currentDistance = nodeDistance;
          currentId = nodeId;
        }
      });

      if (!currentId || currentDistance === Infinity) {
        break;
      }

      queue.delete(currentId);
      if (currentId === endId) {
        break;
      }

      (graph.get(currentId) ?? []).forEach(edge => {
        if (!queue.has(edge.to)) {
          return;
        }

        const candidateDistance = currentDistance + edge.distance;
        if (candidateDistance < (distances.get(edge.to) ?? Infinity)) {
          distances.set(edge.to, candidateDistance);
          previous.set(edge.to, currentId);
        }
      });
    }

    if (!previous.has(endId)) {
      return null;
    }

    const routeIds: string[] = [];
    let currentId: string | null = endId;

    while (currentId) {
      routeIds.unshift(currentId);
      currentId = previous.get(currentId) ?? null;
    }

    return routeIds
      .map(nodeId => nodeLookup.get(nodeId))
      .filter((point): point is Position => Boolean(point));
  }

  private buildInstructions(path: Position[]): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    if (path.length < 2) {
      return instructions;
    }

    instructions.push({
      position: path[0],
      direction: 'straight',
      description: 'Đi theo làn đường từ lối vào',
    });

    for (let index = 1; index < path.length - 1; index += 1) {
      const previous = path[index - 1];
      const current = path[index];
      const next = path[index + 1];
      const direction = getDirectionFromVectors(previous, current, next);

      if (direction === 'straight') {
        continue;
      }

      instructions.push({
        position: current,
        direction,
        description: direction === 'left' ? 'Rẽ trái theo làn đường' : 'Rẽ phải theo làn đường',
      });
    }

    instructions.push({
      position: path[path.length - 1],
      direction: 'straight',
      description: 'Tiếp tục tới vị trí cần tìm',
    });

    return instructions;
  }

  private addGraphEdge(
    graph: Map<string, Edge[]>,
    nodeLookup: Map<string, Position>,
    from: Position,
    to: Position,
    distance: number,
  ) {
    const fromId = toNodeId(from);
    const toId = toNodeId(to);

    nodeLookup.set(fromId, normalizedPoint(from));
    nodeLookup.set(toId, normalizedPoint(to));

    const edges = graph.get(fromId) ?? [];
    if (!edges.some(edge => edge.to === toId && Math.abs(edge.distance - distance) <= POINT_EPSILON)) {
      edges.push({ to: toId, distance });
      graph.set(fromId, edges);
    }

    if (!graph.has(toId)) {
      graph.set(toId, []);
    }
  }

  private segmentKey(segment: LaneSegment) {
    return `${segment.laneIndex}:${segment.segmentIndex}`;
  }
}
