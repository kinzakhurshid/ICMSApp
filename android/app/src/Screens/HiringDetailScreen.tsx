import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';

const HiringDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { callApi } = useAxios();
  const { hiringId } = route.params as { hiringId: string };

  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Description' | 'Responsibilities' | 'Requirements'>('Description');
  const [applicationStats, setApplicationStats] = useState({
    applications: 0,
    shortlisted: 0,
    interviews: 0,
    hired: 0,
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [hiringTeam, setHiringTeam] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchHiringDetails();
    fetchApplications();
    fetchEmployees();
  }, [hiringId]);

  // Update team with employee details when both are available
  useEffect(() => {
    // Check for team in various possible locations
    const teamData = hiring?.team || hiring?.teamMembers || hiring?.hiringTeam || [];
    
    console.log('🔍 Checking for team data...');
    console.log('🔍 hiring.team:', hiring?.team);
    console.log('🔍 hiring.teamMembers:', hiring?.teamMembers);
    console.log('🔍 hiring.hiringTeam:', hiring?.hiringTeam);
    console.log('🔍 Final teamData:', teamData);
    console.log('🔍 teamData is array:', Array.isArray(teamData));
    console.log('🔍 teamData length:', Array.isArray(teamData) ? teamData.length : 'not array');
    
    if (teamData && Array.isArray(teamData) && teamData.length > 0) {
      console.log('🔍 Team data found:', teamData);
      console.log('🔍 Employees loaded:', employees.length);
      
      if (employees.length > 0) {
        // Merge team with employee details
        const teamWithDetails = teamData.map((member: any) => {
          const empId = member.employeeId || member._id || member.id || member;
          
          // Handle case where team member might just be an ID string
          let actualEmpId = empId;
          if (typeof member === 'string') {
            actualEmpId = member;
          }
          
          const empDetails = employees.find((e: any) => {
            const eId = e._id || e.id;
            return String(eId) === String(actualEmpId);
          });
          
          console.log('🔍 Looking for employee:', actualEmpId, 'Found:', !!empDetails);
          
          if (empDetails) {
            return {
              ...member,
              employeeId: actualEmpId,
              _id: actualEmpId,
              name: empDetails.name || empDetails.fullName || `${empDetails.firstName || ''} ${empDetails.lastName || ''}`.trim() || 'Unknown',
              email: empDetails.email || member.email || '',
              role: empDetails.role || empDetails.designation || empDetails.department || empDetails.position || member.role || 'Employee',
            };
          } else {
            // Employee not found in list, use member data if available
            return {
              ...member,
              employeeId: actualEmpId,
              _id: actualEmpId,
              name: member.name || member.fullName || 'Unknown Employee',
              email: member.email || '',
              role: member.role || member.designation || member.department || 'Employee',
            };
          }
        });
        console.log('🔍 Team with details:', teamWithDetails);
        setHiringTeam(teamWithDetails);
      } else {
        // Employees not loaded yet, set team as-is (will be updated when employees load)
        // Handle case where team might be array of IDs or objects
        const initialTeam = teamData.map((member: any) => {
          if (typeof member === 'string') {
            return { employeeId: member, _id: member };
          }
          return member;
        });
        console.log('🔍 Setting initial team (employees not loaded):', initialTeam);
        setHiringTeam(initialTeam);
      }
    } else {
      console.log('🔍 No team data found in hiring object');
      setHiringTeam([]);
    }
  }, [hiring, employees]);

  useEffect(() => {
    // Calculate stats from applications
    if (applications.length > 0) {
      const stats = {
        applications: applications.length,
        shortlisted: applications.filter((app: any) => app.status === 'shortlisted').length,
        interviews: applications.filter((app: any) => app.status === 'interviewed').length,
        hired: applications.filter((app: any) => app.status === 'hired').length,
      };
      setApplicationStats(stats);
    }
  }, [applications]);


  useEffect(() => {
    // Filter employees based on search query
    if (searchQuery.trim()) {
      const filtered = employees.filter((emp: any) => {
        const name = (emp.name || emp.fullName || emp.email || '').toLowerCase();
        const email = (emp.email || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      });
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [searchQuery, employees]);

  const fetchHiringDetails = async () => {
    try {
      setLoading(true);
      const res = await callApi({
        method: 'GET',
        url: `/hirings/${hiringId}`,
      });
      const hiringData = res.data || res;
      console.log('🔍 Full hiring data:', JSON.stringify(hiringData, null, 2));
      console.log('🔍 Team field:', hiringData.team);
      console.log('🔍 Team type:', typeof hiringData.team);
      console.log('🔍 Team is array:', Array.isArray(hiringData.team));
      setHiring(hiringData);
      // Team will be set in useEffect when employees are loaded
    } catch (error) {
      console.error('Error fetching hiring details:', error);
      Alert.alert('Error', 'Failed to load hiring details');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await callApi({
        method: 'GET',
        url: `/applications/hiring/${hiringId}`,
      });
      setApplications(res.data || res || []);
    } catch (error: any) {
      // Silently handle 404 or other errors - applications might not exist yet
      if (error?.response?.status !== 404 && error?.status !== 404) {
        console.warn('Error fetching applications:', error);
      }
      setApplications([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await callApi({
        method: 'GET',
        url: '/employee',
      });
      setEmployees(res.data || res || []);
    } catch (error: any) {
      console.warn('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const handleAddTeamMember = async (employeeId: string) => {
    try {
      // Check if employee is already in team
      if (hiringTeam.some((member: any) => member.employeeId === employeeId || member._id === employeeId)) {
        Alert.alert('Info', 'Employee is already in the team');
        return;
      }

      // Find employee details from the employees list
      const employee = employees.find((emp: any) => (emp._id || emp.id) === employeeId);
      
      // Prepare team array with new member (include employee details for display)
      const updatedTeam = [
        ...hiringTeam.map((member: any) => ({
          employeeId: member.employeeId || member._id,
        })),
        { employeeId },
      ];

      const res = await callApi({
        method: 'PUT',
        url: `/hirings/${hiringId}/team`,
        data: { team: updatedTeam },
      });

      const updatedHiring = res.data || res;
      // Merge employee details with team data for display
      const teamWithDetails = (updatedHiring.team || updatedTeam).map((member: any) => {
        const empId = member.employeeId || member._id;
        const empDetails = employees.find((e: any) => (e._id || e.id) === empId);
        return {
          ...member,
          name: empDetails?.name || empDetails?.fullName || member.name,
          email: empDetails?.email || member.email,
          role: empDetails?.role || empDetails?.designation || empDetails?.department || member.role,
        };
      });
      setHiringTeam(teamWithDetails);
      setSearchQuery('');
      Alert.alert('Success', 'Team member added successfully');
    } catch (error: any) {
      console.error('Error adding team member:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add team member');
    }
  };

  const handleRemoveTeamMember = async (employeeId: string) => {
    try {
      Alert.alert(
        'Remove Team Member',
        'Are you sure you want to remove this team member?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              // Prepare team array without the removed member
              const updatedTeam = hiringTeam
                .filter((member: any) => {
                  const id = member.employeeId || member._id;
                  return id !== employeeId;
                })
                .map((member: any) => ({
                  employeeId: member.employeeId || member._id,
                }));

              const res = await callApi({
                method: 'PUT',
                url: `/hirings/${hiringId}/team`,
                data: { team: updatedTeam },
              });

              const updatedHiring = res.data || res;
              // Merge employee details with team data for display
              const teamWithDetails = (updatedHiring.team || updatedTeam).map((member: any) => {
                const empId = member.employeeId || member._id;
                const empDetails = employees.find((e: any) => (e._id || e.id) === empId);
                return {
                  ...member,
                  name: empDetails?.name || empDetails?.fullName || member.name,
                  email: empDetails?.email || member.email,
                  role: empDetails?.role || empDetails?.designation || empDetails?.department || member.role,
                };
              });
              setHiringTeam(teamWithDetails);
              Alert.alert('Success', 'Team member removed successfully');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error removing team member:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to remove team member');
    }
  };

  const handleUpdateHiringStatus = async (newStatus: 'Open' | 'Closed') => {
    try {
      const res = await callApi({
        method: 'PUT',
        url: `/hirings/hiring/status/${hiringId}`,
        data: { status: newStatus },
      });
      const updatedHiring = res.data || res;
      setHiring(updatedHiring);
      Alert.alert('Success', `Hiring status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating hiring status:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update hiring status');
    }
  };

  const handleDeleteHiring = async () => {
    Alert.alert(
      'Delete Job Opening',
      'Are you sure you want to delete this job opening? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await callApi({
                method: 'DELETE',
                url: `/hirings/${hiringId}`,
              });
              Alert.alert('Success', 'Job opening deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              console.error('Error deleting hiring:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete job opening');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hiring) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hiring Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hiring not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hiring Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('EditHiring', { hiringId: hiring.id || hiring._id })}
            style={styles.editButton}
          >
            <Icon name="edit" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteHiring}
            style={styles.deleteButton}
          >
            <Icon name="delete" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Job Title and Status */}
        <View style={styles.jobTitleCard}>
          <View>
            <Text style={styles.jobTitle}>{hiring.position || 'N/A'}</Text>
            <Text style={styles.postedDate}>Posted {formatDate(hiring.startDate || hiring.createdAt)}</Text>
          </View>
          <View style={styles.statusButtonsRow}>
            <TouchableOpacity
              style={[styles.statusToggleButton, hiring.status === 'Open' && styles.statusToggleButtonActive]}
              onPress={() => hiring.status !== 'Open' && handleUpdateHiringStatus('Open')}
            >
              <Text style={[styles.statusToggleText, hiring.status === 'Open' && styles.statusToggleTextActive]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusToggleButton, hiring.status === 'Closed' && styles.statusToggleButtonActive]}
              onPress={() => hiring.status !== 'Closed' && handleUpdateHiringStatus('Closed')}
            >
              <Text style={[styles.statusToggleText, hiring.status === 'Closed' && styles.statusToggleTextActive]}>
                Mark Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Position Details Card */}
        <View style={styles.positionDetailsCard}>
          <View style={styles.positionDetailsHeader}>
            <Icon name="menu-book" size={24} color="#111827" />
            <Text style={styles.positionDetailsTitle}>Position Details</Text>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Description' && styles.tabActive]}
              onPress={() => setActiveTab('Description')}
            >
              <Text style={[styles.tabText, activeTab === 'Description' && styles.tabTextActive]}>
                Description
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Responsibilities' && styles.tabActive]}
              onPress={() => setActiveTab('Responsibilities')}
            >
              <Text style={[styles.tabText, activeTab === 'Responsibilities' && styles.tabTextActive]}>
                Responsibilities
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Requirements' && styles.tabActive]}
              onPress={() => setActiveTab('Requirements')}
            >
              <Text style={[styles.tabText, activeTab === 'Requirements' && styles.tabTextActive]}>
                Requirements
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'Description' && (
              <Text style={styles.descriptionText}>
                {hiring.description || 'No description available.'}
              </Text>
            )}
            
            {activeTab === 'Responsibilities' && (
              <View style={styles.listContainer}>
                {hiring.responsibilities && hiring.responsibilities.length > 0 ? (
                  hiring.responsibilities.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.listItem}>• {item}</Text>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No responsibilities listed.</Text>
                )}
              </View>
            )}
            
            {activeTab === 'Requirements' && (
              <View style={styles.listContainer}>
                {hiring.requirements && hiring.requirements.length > 0 ? (
                  hiring.requirements.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.listItem}>• {item}</Text>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No requirements listed.</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Position Overview Card */}
        <View style={styles.positionOverviewCard}>
          <View style={styles.cardHeader}>
            <Icon name="work" size={24} color="#FF6B35" />
            <Text style={styles.cardTitle}>Position Overview</Text>
          </View>
          
          <View style={styles.positionOverview}>
            <View style={styles.positionOverviewItem}>
              <Icon name="work" size={20} color="#2196F3" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Job Type</Text>
                <Text style={styles.positionOverviewValue}>{hiring.jobType || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.positionOverviewItem}>
              <Icon name="schedule" size={20} color="#9C27B0" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Work Mode</Text>
                <Text style={styles.positionOverviewValue}>{hiring.workMode || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.positionOverviewItem}>
              <Icon name="event" size={20} color="#E91E63" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Posted On</Text>
                <Text style={styles.positionOverviewValue}>{formatDate(hiring.startDate || hiring.createdAt)}</Text>
              </View>
            </View>
            
            <View style={styles.positionOverviewItem}>
              <Icon name="attach-money" size={20} color="#4CAF50" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Salary Range</Text>
                <Text style={styles.positionOverviewValue}>{hiring.salaryRange || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.positionOverviewItem}>
              <Icon name="location-on" size={20} color="#4CAF50" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Location</Text>
                <Text style={styles.positionOverviewValue}>{hiring.location || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.positionOverviewItem}>
              <Icon name="people" size={20} color="#FF9800" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Positions</Text>
                <Text style={styles.positionOverviewValue}>{hiring.numberOfPositions || '1'}</Text>
              </View>
            </View>
            
            <View style={styles.positionOverviewItem}>
              <Icon name="event" size={20} color="#2196F3" />
              <View style={styles.positionOverviewText}>
                <Text style={styles.positionOverviewLabel}>Deadline</Text>
                <Text style={styles.positionOverviewValue}>{formatDate(hiring.endDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Application Stats Card */}
        <View style={styles.applicationCard}>
          <View style={styles.cardHeader}>
            <Icon name="assessment" size={24} color="#FF6B35" />
            <Text style={styles.cardTitle}>Application Stats</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.statValue}>{applicationStats.applications}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.statValue}>{applicationStats.shortlisted}</Text>
              <Text style={styles.statLabel}>Shortlisted</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.statValue}>{applicationStats.interviews}</Text>
              <Text style={styles.statLabel}>Interviews</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.statValue}>{applicationStats.hired}</Text>
              <Text style={styles.statLabel}>Hired</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              // TODO: Navigate to applications screen or show modal
              Alert.alert('Applications', `Total: ${applications.length} applications`);
            }}
          >
            <Text style={styles.viewAllText}>View all applications →</Text>
          </TouchableOpacity>
        </View>

        {/* Hiring Team Card */}
        <View style={styles.hiringTeamCard}>
          <View style={styles.hiringTeamHeader}>
            <Icon name="people" size={24} color="#111827" />
            <Text style={styles.cardTitle}>Hiring Team ({hiringTeam.length})</Text>
          </View>
          
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search employees..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Icon name="person-add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Employee List - Show all employees, filtered by search */}
          <View style={styles.employeeListContainer}>
            <FlatList
              data={searchQuery.trim() ? filteredEmployees : employees}
              keyExtractor={(item, index) => item._id || item.id || index.toString()}
              renderItem={({ item }) => {
                const employeeId = item._id || item.id;
                const isInTeam = hiringTeam.some(
                  (member: any) => (member.employeeId || member._id) === employeeId
                );
                const employeeName = item.name || item.fullName || item.email || 'Employee';
                const employeeRole = item.role || item.department || '';
                
                return (
                  <TouchableOpacity
                    style={styles.employeeListItem}
                    onPress={() => {
                      if (!isInTeam) {
                        handleAddTeamMember(employeeId);
                      }
                    }}
                    disabled={isInTeam}
                  >
                    <View style={styles.employeeListItemContent}>
                      <Text style={[styles.employeeName, isInTeam && styles.employeeNameDisabled]}>
                        {employeeName}
                      </Text>
                      {employeeRole && (
                        <Text style={styles.employeeRole}>{employeeRole}</Text>
                      )}
                    </View>
                    {isInTeam ? (
                      <Icon name="check-circle" size={20} color="#4CAF50" />
                    ) : (
                      <Icon name="add-circle-outline" size={20} color="#FF6B35" />
                    )}
                  </TouchableOpacity>
                );
              }}
              scrollEnabled={false}
            />
          </View>

          {hiringTeam.length === 0 ? (
            <Text style={styles.emptyTeamText}>
              No team members yet. Search and add employees above.
            </Text>
          ) : (
            <View style={styles.selectedTeamSection}>
              <Text style={styles.selectedTeamTitle}>Selected Team Members ({hiringTeam.length})</Text>
              <View style={styles.teamList}>
                {hiringTeam.map((member: any, idx: number) => {
                  const employeeId = member.employeeId || member._id;
                  const memberName = member.name || member.fullName || member.email || 'Team Member';
                  const memberRole = member.role || member.designation || member.department || 'Employee';
                  return (
                    <View key={idx} style={styles.teamMemberCard}>
                      <View style={styles.teamMemberInfo}>
                        <View style={styles.teamMemberAvatar}>
                          <Text style={styles.teamMemberAvatarText}>
                            {memberName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.teamMemberDetails}>
                          <Text style={styles.teamMemberName}>{memberName}</Text>
                          <Text style={styles.teamMemberDesignation}>{memberRole}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveTeamMember(employeeId)}
                        style={styles.removeButton}
                      >
                        <Icon name="close" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  jobTitleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  postedDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusToggleButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusToggleTextActive: {
    color: '#FFFFFF',
  },
  positionDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  positionDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 200,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  listContainer: {
    paddingTop: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  positionOverviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  positionOverview: {
    marginBottom: 20,
  },
  positionOverviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionOverviewText: {
    marginLeft: 12,
    flex: 1,
  },
  positionOverviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  positionOverviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewAllButton: {
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  hiringTeamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hiringTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTeamText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedTeamSection: {
    marginTop: 16,
  },
  selectedTeamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  teamList: {
    gap: 12,
  },
  teamMemberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teamMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamMemberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  teamMemberDetails: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  teamMemberDesignation: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  employeeListContainer: {
    maxHeight: 300,
    marginTop: 8,
  },
  employeeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  employeeListItemContent: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  employeeNameDisabled: {
    color: '#9CA3AF',
  },
  employeeRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default HiringDetailScreen;
