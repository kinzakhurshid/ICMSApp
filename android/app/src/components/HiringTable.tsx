import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import SearchableSelect from './SearchableSelect';

interface Hiring {
  id: string;
  position: string;
  jobType: string;
  experience: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  applicantsCount: number;
}

interface HiringTableProps {
  hirings: Hiring[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  filters: {
    status: string;
    jobType: string;
    location: string;
  };
  availableFilters: {
    locations: string[];
    jobTypes: string[];
    statuses: string[];
  };
  setFilters: (filters: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const HiringTable: React.FC<HiringTableProps> = ({
  hirings,
  page,
  totalPages,
  setPage,
  filters,
  availableFilters,
  setFilters,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  onView,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const navigation = useNavigation();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return '#4CAF50';
      case 'closed':
        return '#F44336';
      case 'paused':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getTimeLeftColor = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '#F44336';
    if (diffDays <= 5) return '#FF9800';
    return '#4CAF50';
  };

  const getTimeLeft = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return '0 days left';
    return `${diffDays} days left`;
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Job Opening',
      'Are you sure you want to delete this job opening?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hiring Positions</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search positions..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
      </View>

      {/* New Job button row */}
      <View style={styles.newJobRow}>
        <TouchableOpacity
          style={styles.newJobButton}
          onPress={() => (navigation as any).navigate('CreateJob')}
        >
          <Icon name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newJobButtonText}>New Job</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <SearchableSelect
              label="Status"
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                ...availableFilters.statuses.map(status => ({
                  value: status,
                  label: status,
                })),
              ]}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              containerStyle={styles.filterSelect}
            />
            
            <SearchableSelect
              label="Job Type"
              placeholder="All Job Types"
              options={[
                { value: '', label: 'All Job Types' },
                ...availableFilters.jobTypes.map(type => ({
                  value: type,
                  label: type,
                })),
              ]}
              value={filters.jobType}
              onChange={(value) => setFilters({ ...filters, jobType: value })}
              containerStyle={styles.filterSelect}
            />
            
            <SearchableSelect
              label="Location"
              placeholder="All Locations"
              options={[
                { value: '', label: 'All Locations' },
                ...availableFilters.locations.map(location => ({
                  value: location,
                  label: location,
                })),
              ]}
              value={filters.location}
              onChange={(value) => setFilters({ ...filters, location: value })}
              containerStyle={styles.filterSelect}
            />
          </View>
        </View>
      )}

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.positionCol}>
              <Text style={styles.headerText}>POSITION</Text>
            </View>
            <View style={styles.jobTypeCol}>
              <Text style={styles.headerText}>JOB TYPE</Text>
            </View>
            <View style={styles.experienceCol}>
              <Text style={styles.headerText}>EXPERIENCE</Text>
            </View>
            <View style={styles.locationCol}>
              <Text style={styles.headerText}>LOCATION</Text>
            </View>
            <View style={styles.statusCol}>
              <Text style={styles.headerText}>STATUS</Text>
            </View>
            <View style={styles.startDateCol}>
              <Text style={styles.headerText}>START DATE</Text>
            </View>
            <View style={styles.endDateCol}>
              <Text style={styles.headerText}>END DATE</Text>
            </View>
            <View style={styles.timeLeftCol}>
              <Text style={styles.headerText}>TIME LEFT</Text>
            </View>
            <View style={styles.actionsCol}>
              <Text style={styles.headerText}>ACTIONS</Text>
            </View>
          </View>

          {/* Table Rows */}
          {hirings.map((hiring) => (
            <View key={hiring.id} style={styles.tableRow}>
              <View style={styles.positionCol}>
                <Text style={styles.cellText}>{hiring.position}</Text>
              </View>
              <View style={styles.jobTypeCol}>
                <Text style={styles.cellText}>{hiring.jobType}</Text>
              </View>
              <View style={styles.experienceCol}>
                <Text style={styles.cellText}>{hiring.experience}</Text>
              </View>
              <View style={styles.locationCol}>
                <Text style={styles.cellText}>{hiring.location}</Text>
              </View>
              <View style={styles.statusCol}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(hiring.status) }]}>
                  <Text style={styles.statusText}>{hiring.status}</Text>
                </View>
              </View>
              <View style={styles.startDateCol}>
                <Text style={styles.cellText}>
                  {new Date(hiring.startDate).toLocaleDateString('en-GB')}
                </Text>
              </View>
              <View style={styles.endDateCol}>
                <Text style={styles.cellText}>
                  {new Date(hiring.endDate).toLocaleDateString('en-GB')}
                </Text>
              </View>
              <View style={styles.timeLeftCol}>
                <Text style={[styles.timeLeftText, { color: getTimeLeftColor(hiring.endDate) }]}>
                  {getTimeLeft(hiring.endDate)}
                </Text>
              </View>
              <View style={styles.actionsCol}>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(hiring.id)}
                  >
                    <Icon name="edit" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(hiring.id)}
                  >
                    <Icon name="delete" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Pagination */}
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
          onPress={() => setPage(page - 1)}
          disabled={page === 1}
        >
          <Text style={[styles.paginationText, page === 1 && styles.paginationTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.paginationInfo}>
          Page {page} of {totalPages}
        </Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          <Text style={[styles.paginationText, page === totalPages && styles.paginationTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newJobRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  newJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  newJobButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  filterSelect: {
    flex: 1,
    minWidth: 120,
  },
  tableScrollContainer: {
    maxHeight: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    minWidth: 1200,
    backgroundColor: 'white',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
    minHeight: 60,
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  positionCol: { 
    width: 180,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  jobTypeCol: { 
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  experienceCol: { 
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  locationCol: { 
    width: 150,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  statusCol: { 
    width: 100,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startDateCol: { 
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  endDateCol: { 
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  timeLeftCol: { 
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  actionsCol: { 
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  timeLeftText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  paginationButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  paginationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default HiringTable;
