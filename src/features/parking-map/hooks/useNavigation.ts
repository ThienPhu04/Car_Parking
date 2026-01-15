import { useState, useCallback } from 'react';
import { Position } from '../../../types/parking.types';
import { PathFinder } from '@shared/utils/pathfinding';
import { PathNode, NavigationPath } from '../../../types/navigation.types';

export const useNavigation = (gridMap: number[][]) => {
  const [path, setPath] = useState<PathNode[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  const pathFinder = new PathFinder(gridMap);

  const calculatePath = useCallback(
    (start: Position, end: Position): NavigationPath | null => {
      try {
        setIsNavigating(true);
        const foundPath = pathFinder.findPath(start, end);

        if (foundPath.length === 0) {
          console.warn('No path found');
          return null;
        }

        setPath(foundPath);

        // Calculate distance (Manhattan distance)
        const distance = foundPath.reduce((acc, node, index) => {
          if (index === 0) return 0;
          const prev = foundPath[index - 1];
          return acc + Math.abs(node.x - prev.x) + Math.abs(node.y - prev.y);
        }, 0);

        // Estimate time (assuming 1 meter per cell, walking speed 1.4 m/s)
        const estimatedTime = Math.ceil((distance * 1.0) / 1.4);

        return {
          path: foundPath,
          distance: distance * 1.0, // meters
          estimatedTime,
        };
      } catch (error) {
        console.error('Error calculating path:', error);
        return null;
      } finally {
        setIsNavigating(false);
      }
    },
    [gridMap]
  );

  const clearPath = useCallback(() => {
    setPath([]);
    setIsNavigating(false);
  }, []);

  return {
    path,
    isNavigating,
    calculatePath,
    clearPath,
  };
};
