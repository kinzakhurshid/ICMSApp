import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  title: string;
  value: string | number;
  subtitleLeft?: string; // e.g., "↑ 22%"
  subtitleRight?: string; // e.g., "Last 30 days"
  progressPercent?: number; // 0..100, shows small ring like web
  iconName?: string;
  iconBg?: string;
  ringColor?: string;
  ringTrack?: string;
  rightHint?: string; // e.g., "October"
};

import ProgressRing from './ProgressRing';

const DashboardStatCard: React.FC<Props> = ({ title, value, subtitleLeft, subtitleRight, progressPercent, iconName = 'dashboard', iconBg = 'rgba(255,87,34,0.1)', ringColor = '#7C3AED', ringTrack = '#E5E7EB', rightHint }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}> 
          <View style={[styles.iconBadge, { backgroundColor: iconBg }]}> 
            <MaterialIcons name={iconName as any} size={18} color="#FF5722" />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightHint ? <Text style={styles.hint}>{rightHint}</Text> : null}
      </View>
      <View style={[styles.midRow]}> 
        <Text style={styles.value}>{String(value)}</Text>
        {typeof progressPercent === 'number' && (
          <ProgressRing size={38} stroke={6} progress={progressPercent} color={ringColor} trackColor={ringTrack} />
        )}
      </View>
      <View style={styles.footerRow}>
        {subtitleLeft ? (
          <View style={styles.footerContent}>
            <Text style={[styles.badge, styles.badgeGreen]}>{subtitleLeft}</Text>
            {subtitleRight ? <Text style={[styles.badge, styles.badgeGray, styles.badgeNextLine]}>{subtitleRight}</Text> : null}
          </View>
        ) : (
          subtitleRight ? <Text style={[styles.badge, styles.badgeGray]}>{subtitleRight}</Text> : <View />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 11, color: '#6b7280' },
  midRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  title: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  footerContent: {
    flexDirection: 'column',
    gap: 4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    fontSize: 11,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  badgeNextLine: {
    marginTop: 4,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    color: '#059669',
  },
  badgeGray: {
    backgroundColor: 'rgba(107,114,128,0.12)',
    color: '#6b7280',
  },
});

export default DashboardStatCard;


