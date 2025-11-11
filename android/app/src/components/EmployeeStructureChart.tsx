import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  male: number;
  female: number;
  other: number;
};

const EmployeeStructureChart: React.FC<Props> = ({ male, female, other }) => {
  const total = male + female + other || 1;
  const mPct = Math.round((male / total) * 100);
  const fPct = Math.round((female / total) * 100);
  const oPct = 100 - mPct - fPct;

  const size = 140;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circum = 2 * Math.PI * radius;

  const arc = (pct: number) => (pct / 100) * circum;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Employee Structure</Text>
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Svg width={size} height={size}>
          <Circle cx={size/2} cy={size/2} r={radius} stroke="#F3F4F6" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#FB923C"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${arc(mPct)} ${circum}`}
            rotation="-90"
            originX={size/2}
            originY={size/2}
            strokeLinecap="round"
          />
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#FDBA74"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${arc(fPct)} ${circum}`}
            strokeDashoffset={arc(mPct)}
            rotation="-90"
            originX={size/2}
            originY={size/2}
            strokeLinecap="round"
          />
          {oPct > 0 && (
            <Circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke="#D1D5DB"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${arc(oPct)} ${circum}`}
              strokeDashoffset={arc(mPct + fPct)}
              rotation="-90"
              originX={size/2}
              originY={size/2}
              strokeLinecap="round"
            />
          )}
        </Svg>
        <View style={styles.centerText}>
          <Text style={styles.centerTop}>Total</Text>
          <Text style={styles.centerBottom}>100%</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <View style={styles.row}><Text style={styles.label}>Male</Text><View style={styles.barBg}><View style={[styles.barFill,{ width: `${mPct}%`}]} /></View><Text style={styles.pct}>{mPct}%</Text></View>
        <View style={styles.row}><Text style={styles.label}>Female</Text><View style={styles.barBg}><View style={[styles.barFillLight,{ width: `${fPct}%`}]} /></View><Text style={styles.pct}>{fPct}%</Text></View>
        <View style={styles.row}><Text style={styles.label}>Other</Text><View style={styles.barBg}><View style={[styles.barFillGray,{ width: `${oPct}%`}]} /></View><Text style={styles.pct}>{oPct}%</Text></View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 64, color: '#111827', fontSize: 13 },
  barBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 999 },
  barFill: { height: '100%', backgroundColor: '#FB923C', borderRadius: 999 },
  barFillLight: { height: '100%', backgroundColor: '#FDBA74', borderRadius: 999 },
  barFillGray: { height: '100%', backgroundColor: '#D1D5DB', borderRadius: 999 },
  pct: { width: 40, textAlign: 'right', color: '#6b7280', fontSize: 12 },
});

export default EmployeeStructureChart;








