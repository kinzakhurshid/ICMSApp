import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = { title: string; value: number | string; icon: string; color?: string };

// Map icon names to actual MaterialIcons/Ionicons names
const getIconName = (icon: string): { library: 'material' | 'ionicons', name: string } => {
  const iconMap: Record<string, { library: 'material' | 'ionicons', name: string }> = {
    'folder': { library: 'material', name: 'folder' },
    'trending-up': { library: 'material', name: 'trending-up' },
    'check-circle': { library: 'material', name: 'check-circle' },
    'schedule': { library: 'material', name: 'schedule' },
    'event': { library: 'material', name: 'event' },
    'pause-circle': { library: 'material', name: 'pause-circle' },
    'priority-high': { library: 'material', name: 'priority-high' },
    'grid-view': { library: 'material', name: 'grid-view' },
    'play-circle-outline': { library: 'ionicons', name: 'play-circle-outline' },
  };
  
  return iconMap[icon] || { library: 'material', name: icon };
};

const ProjectKpiCard: React.FC<Props> = ({ title, value, icon, color = '#4b5563' }) => {
  const iconInfo = getIconName(icon);
  const iconColor = color;
  
  // Determine background color based on card type
  const getBackgroundColor = () => {
    if (title === 'Total Projects') return 'rgba(107, 114, 128, 0.1)';
    if (title === 'In Progress') return 'rgba(249, 115, 22, 0.1)';
    if (title === 'Completed') return 'rgba(34, 197, 94, 0.1)';
    if (title === 'Not Started') return 'rgba(156, 163, 175, 0.1)';
    if (title === 'Upcoming') return 'rgba(59, 130, 246, 0.1)';
    if (title === 'On Hold') return 'rgba(245, 158, 11, 0.1)';
    if (title === 'High Priority') return 'rgba(239, 68, 68, 0.1)';
    return 'rgba(255, 87, 34, 0.1)';
  };

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: getBackgroundColor() }]}>
        {iconInfo.library === 'material' ? (
          <MaterialIcons name={iconInfo.name as any} size={22} color={iconColor} />
        ) : (
          <Ionicons name={iconInfo.name as any} size={22} color={iconColor} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{String(value).padStart(2, '0')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  iconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { color: '#6b7280', fontSize: 13, marginBottom: 8 },
  value: { color: '#111827', fontSize: 22, fontWeight: '800' },
});

export default ProjectKpiCard;









