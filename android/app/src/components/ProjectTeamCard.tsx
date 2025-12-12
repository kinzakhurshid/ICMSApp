import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface TeamMember {
  _id: string;
  fullName: string;
  profilePic?: string;
}

interface ProjectTeamCardProps {
  projectManager?: TeamMember;
  teamMembers: TeamMember[];
}

const ProjectTeamCard: React.FC<ProjectTeamCardProps> = ({ projectManager, teamMembers }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderMember = (member: TeamMember, isManager: boolean = false) => {
    const avatarColor = isManager ? '#ef4444' : '#3b82f6';
    
    return (
      <View key={member._id} style={styles.memberCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          {member.profilePic ? (
            <Image source={{ uri: member.profilePic }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(member.fullName)}</Text>
          )}
        </View>
        <Text style={styles.memberName} numberOfLines={1}>
          {member.fullName}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Team</Text>
      
      {projectManager && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Manager</Text>
          {renderMember(projectManager, true)}
        </View>
      )}

      {teamMembers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          {teamMembers.map((member) => renderMember(member, false))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styling removed - parent card handles it
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
});

export default ProjectTeamCard;



