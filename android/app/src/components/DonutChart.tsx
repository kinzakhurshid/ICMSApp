import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type DonutSegment = {
  label: string;
  value: number; // absolute, not percent
  color: string;
};

type Props = {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  title?: string;
  centerTop?: string;
  centerBottom?: string;
};

const DonutChart: React.FC<Props> = ({ segments, size = 140, stroke = 16, title, centerTop, centerBottom }) => {
  const total = Math.max(1, segments.reduce((s, seg) => s + (seg.value || 0), 0));
  const radius = (size - stroke) / 2;
  const circum = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle cx={size/2} cy={size/2} r={radius} stroke="#F3F4F6" strokeWidth={stroke} fill="none" />
          {segments.map((seg, idx) => {
            const pct = (seg.value || 0) / total;
            const dash = pct * circum;
            const offset = -accumulated * circum;
            accumulated += pct;
            return (
              <Circle
                key={seg.label + idx}
                cx={size/2}
                cy={size/2}
                r={radius}
                stroke={seg.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circum}`}
                strokeDashoffset={offset}
                rotation="-90"
                originX={size/2}
                originY={size/2}
                strokeLinecap="round"
              />
            );
          })}
          {/* Fill remaining gap if segments don't add up to 100% */}
          {accumulated < 1 && (
            <Circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke="#F3F4F6"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${(1 - accumulated) * circum} ${circum}`}
              strokeDashoffset={-accumulated * circum}
              rotation="-90"
              originX={size/2}
              originY={size/2}
              strokeLinecap="round"
            />
          )}
        </Svg>
        {(centerTop || centerBottom) && (
          <View style={styles.centerText}>
            {centerTop ? <Text style={styles.centerTop}>{centerTop}</Text> : null}
            {centerBottom ? <Text style={styles.centerBottom}>{centerBottom}</Text> : null}
          </View>
        )}
      </View>
      <View style={{ gap: 6 }}>
        {segments.map(s => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
            <Text style={styles.legendPct}>{s.value || 0}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  centerText: { position: 'absolute', alignItems: 'center', top: '42%', left: 0, right: 0 },
  centerTop: { fontSize: 12, color: '#6b7280' },
  centerBottom: { fontSize: 16, fontWeight: '700', color: '#111827' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { flex: 1, color: '#111827', fontSize: 13 },
  legendPct: { color: '#111827', fontSize: 13, fontWeight: '600' },
});

export default DonutChart;









