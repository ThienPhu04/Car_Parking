import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../../shared/constants/colors';
import { PathNode } from '../../../types/navigation.types';

interface NavigationPathProps {
  path: PathNode[];
  width: number;
  height: number;
  cellSize: number;
}

export const NavigationPath: React.FC<NavigationPathProps> = ({
  path,
  width,
  height,
  cellSize,
}) => {
  if (path.length < 2) return null;

  const pathString = path
    .map((node, index) => {
      const x = node.x * cellSize + cellSize / 2;
      const y = node.y * cellSize + cellSize / 2;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Path
          d={pathString}
          stroke={COLORS.primary}
          strokeWidth={3}
          fill="none"
          strokeDasharray="5,5"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});