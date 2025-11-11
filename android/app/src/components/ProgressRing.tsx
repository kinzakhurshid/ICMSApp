import React from 'react';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  size?: number;
  stroke?: number;
  progress: number; // 0..100
  color?: string;
  trackColor?: string;
};

const ProgressRing: React.FC<Props> = ({ size = 40, stroke = 5, progress, color = '#FF6B35', trackColor = '#E5E7EB' }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
};

export default ProgressRing;









