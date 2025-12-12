import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Project } from '../Screens/ProjectScreen';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProjectCardProps {
  project: Project;
  onPress?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(project)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{getInitials(project.name)}</Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <PriorityBadge priority={project.priority} variant="outlined" />
        </View>
      </View>

      <Text style={styles.projectName} numberOfLines={1}>
        {project.name}
      </Text>

      {project.description && (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Started on:</Text>
          <Text style={styles.detailValue}>{formatDate(project.startDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estimated end:</Text>
          <Text style={styles.detailValue}>{formatDate(project.endDate)}</Text>
        </View>
        {project.projectManager && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Manager:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {project.projectManager.fullName || 'N/A'}
            </Text>
          </View>
        )}
        {(!project.teamMembers || project.teamMembers.length === 0) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Team:</Text>
            <Text style={styles.detailValue}>No team assigned</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <StatusBadge status={project.status} size="small" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardHeaderRight: {
    marginLeft: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
    flex: 1,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});

export default ProjectCard;




