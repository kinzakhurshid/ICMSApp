import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useAxios } from '../hooks/useAxios';

interface JobApplication {
  _id: string;
  candidateName: string;
  position: string;
  email: string;
  phone: string;
  experience: string;
  status: 'Applied' | 'Screening' | 'Interview' | 'Selected' | 'Rejected';
  appliedDate: string;
  profilePic?: string;
  resume?: string;
}

const HiringScreen: React.FC = () => {
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    fetchHiringData();
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      filterApplications();
    }
  }, [searchQuery, applications, selectedStatus]);

  const fetchHiringData = async () => {
    try {
      setLoading(true);
      
      const response = await callApi({ 
        method: "GET", 
        url: "/HR/job-applications" 
      });

      if (response.success) {
        setApplications(response.data.applications || []);
      }

    } catch (error) {
      console.error("Error fetching hiring data:", error);
      // Mock data for demonstration
      setApplications([
        {
          _id: '1',
          candidateName: 'Sarah Wilson',
          position: 'Frontend Developer',
          email: 'sarah.wilson@email.com',
          phone: '+1234567890',
          experience: '3 years',
          status: 'Interview',
          appliedDate: '2024-01-15',
          profilePic: 'https://randomuser.me/api/portraits/women/2.jpg'
        },
        {
          _id: '2',
          candidateName: 'David Brown',
          position: 'Backend Developer',
          email: 'david.brown@email.com',
          phone: '+1234567891',
          experience: '5 years',
          status: 'Screening',
          appliedDate: '2024-01-14',
          profilePic: 'https://randomuser.me/api/portraits/men/3.jpg'
        },
        {
          _id: '3',
          candidateName: 'Emily Davis',
          position: 'UI/UX Designer',
          email: 'emily.davis@email.com',
          phone: '+1234567892',
          experience: '2 years',
          status: 'Selected',
          appliedDate: '2024-01-13',
          profilePic: 'https://randomuser.me/api/portraits/women/3.jpg'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHiringData();
    setRefreshing(false);
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchQuery.trim()) {
      filtered = filtered.filter(app =>
        app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return '#2196F3';
      case 'Screening': return '#FF9800';
      case 'Interview': return '#9C27B0';
      case 'Selected': return '#4CAF50';
      case 'Rejected': return '#F44336';
      default: return '#9CA3AF';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const renderApplicationRow = (application: JobApplication, index: number) => {
    return (
      <View key={application._id} style={styles.applicationRow}>
        <View style={styles.checkboxColumn}>
          <TouchableOpacity style={styles.checkbox} />
        </View>
        <Text style={styles.serialNumber}>{index + 1}</Text>
        <View style={styles.candidateColumn}>
          <View style={styles.avatarContainer}>
            {application.profilePic ? (
              <Image source={{ uri: application.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(application.candidateName)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.candidateName}>{application.candidateName}</Text>
        </View>
        <Text style={styles.positionColumn}>{application.position}</Text>
        <Text style={styles.emailColumn}>{application.email}</Text>
        <Text style={styles.phoneColumn}>{application.phone}</Text>
        <Text style={styles.experienceColumn}>{application.experience}</Text>
        <Text style={styles.dateColumn}>{formatDate(application.appliedDate)}</Text>
        <View style={[styles.statusColumn, { backgroundColor: getStatusColor(application.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
            {application.status}
          </Text>
        </View>
        <View style={styles.actionsColumn}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const statusOptions = ['All', 'Applied', 'Screening', 'Interview', 'Selected', 'Rejected'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hiring</Text>
      </View>

      {/* Search and Actions Bar */}
      <View style={styles.searchActionsBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidates..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download" size={16} color="white" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.addButtonText}>Add Job</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusChip,
              selectedStatus === status && styles.selectedStatusChip
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.statusChipText,
              selectedStatus === status && styles.selectedStatusChipText
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.checkboxColumn}>
            <TouchableOpacity style={styles.checkbox} />
          </View>
          <Text style={[styles.tableHeaderText, styles.serialHeader]}>SR#</Text>
          <Text style={[styles.tableHeaderText, styles.candidateHeader]}>CANDIDATE</Text>
          <Text style={[styles.tableHeaderText, styles.positionHeader]}>POSITION</Text>
          <Text style={[styles.tableHeaderText, styles.emailHeader]}>EMAIL</Text>
          <Text style={[styles.tableHeaderText, styles.phoneHeader]}>PHONE</Text>
          <Text style={[styles.tableHeaderText, styles.experienceHeader]}>EXP</Text>
          <Text style={[styles.tableHeaderText, styles.dateHeader]}>APPLIED</Text>
          <Text style={[styles.tableHeaderText, styles.statusHeader]}>STATUS</Text>
          <Text style={[styles.tableHeaderText, styles.actionsHeader]}>ACTIONS</Text>
        </View>

        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
          {filteredApplications.length > 0 ? (
            filteredApplications.map((application, index) => renderApplicationRow(application, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No applications found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusFilter: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusFilterContent: {
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedStatusChip: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedStatusChipText: {
    color: 'white',
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  serialHeader: {
    width: 40,
    textAlign: 'center',
  },
  candidateHeader: {
    flex: 1,
    marginLeft: 16,
  },
  positionHeader: {
    flex: 1,
    marginLeft: 16,
  },
  emailHeader: {
    flex: 1,
    marginLeft: 16,
  },
  phoneHeader: {
    flex: 1,
    marginLeft: 16,
  },
  experienceHeader: {
    flex: 1,
    marginLeft: 16,
  },
  dateHeader: {
    flex: 1,
    marginLeft: 16,
  },
  statusHeader: {
    flex: 1,
    marginLeft: 16,
  },
  actionsHeader: {
    width: 80,
    marginLeft: 16,
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: 400,
  },
  applicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serialNumber: {
    width: 40,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  candidateColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  positionColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  emailColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  phoneColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  experienceColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  dateColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  statusColumn: {
    flex: 1,
    marginLeft: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsColumn: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  actionButton: {
    padding: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 3,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default HiringScreen;
