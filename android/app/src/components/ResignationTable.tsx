import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SearchableSelect from './SearchableSelect';

interface Resignation {
  _id: string;
  name: string;
  designation: string;
  separationType: string;
  effectiveFrom: string;
  lastWorkingDay: string;
  reason: string;
  submittedOn: string;
  status: string;
}

interface ResignationTableProps {
  pendingResignations: Resignation[];
  allResignations: Resignation[];
  loading: boolean;
  onStatusUpdate: (id: string, status: 'Accepted' | 'Rejected') => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: any) => void;
  filters: {
    status: string;
    separationType: string;
    search: string;
  };
}

const ResignationTable: React.FC<ResignationTableProps> = ({
  pendingResignations,
  allResignations,
  loading,
  onStatusUpdate,
  onDelete,
  formatDate,
  currentPage,
  totalPages,
  onPageChange,
  onFilterChange,
  filters,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return '#4CAF50';
      case 'Requested':
        return '#2196F3';
      case 'Rejected':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return '#E8F5E8';
      case 'Requested':
        return '#E3F2FD';
      case 'Rejected':
        return '#FFEBEE';
      default:
        return '#FFF8E1';
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    onFilterChange({ ...filters, search: text });
  };

  const handleStatusUpdate = (id: string, status: 'Accepted' | 'Rejected') => {
    Alert.alert(
      `${status} Resignation`,
      `Are you sure you want to ${status.toLowerCase()} this resignation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: status, style: 'default', onPress: () => onStatusUpdate(id, status) },
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Resignation',
      'Are you sure you want to delete this resignation record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  const renderTableRow = (resignation: Resignation, index: number, showActions: boolean = true) => (
    <View key={resignation._id} style={styles.tableRow}>
      <View style={styles.srCol}>
        <Text style={styles.cellText}>{index + 1}</Text>
      </View>
      <View style={styles.employeeCol}>
        <Text style={styles.cellText}>{resignation.name}</Text>
      </View>
      <View style={styles.designationCol}>
        <Text style={styles.cellText}>{resignation.designation}</Text>
      </View>
      <View style={styles.typeCol}>
        <Text style={styles.cellText}>{resignation.separationType}</Text>
      </View>
      <View style={styles.effectiveCol}>
        <Text style={styles.cellText}>{formatDate(resignation.effectiveFrom)}</Text>
      </View>
      <View style={styles.lastDayCol}>
        <Text style={styles.cellText}>{formatDate(resignation.lastWorkingDay)}</Text>
      </View>
      <View style={styles.reasonCol}>
        <Text style={styles.cellText} numberOfLines={2}>{resignation.reason}</Text>
      </View>
      <View style={styles.submittedCol}>
        <Text style={styles.cellText}>{formatDate(resignation.submittedOn)}</Text>
      </View>
      {showActions && (
        <View style={styles.statusCol}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(resignation.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(resignation.status) }]}>
              {resignation.status}
            </Text>
          </View>
        </View>
      )}
      <View style={styles.actionsCol}>
        {showActions ? (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate(resignation._id, 'Accepted')}
            >
              <Icon name="check" size={16} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate(resignation._id, 'Rejected')}
            >
              <Icon name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(resignation._id)}
          >
            <Icon name="delete" size={16} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Pending Resignations Table */}
      {pendingResignations.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>
            Requested Resignations ({pendingResignations.length})
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.srCol}>
                  <Text style={styles.headerText}>#</Text>
                </View>
                <View style={styles.employeeCol}>
                  <Text style={styles.headerText}>EMPLOYEE</Text>
                </View>
                <View style={styles.designationCol}>
                  <Text style={styles.headerText}>DESIGNATION</Text>
                </View>
                <View style={styles.typeCol}>
                  <Text style={styles.headerText}>TYPE</Text>
                </View>
                <View style={styles.effectiveCol}>
                  <Text style={styles.headerText}>EFFECTIVE FROM</Text>
                </View>
                <View style={styles.lastDayCol}>
                  <Text style={styles.headerText}>LAST WORKING DAY</Text>
                </View>
                <View style={styles.reasonCol}>
                  <Text style={styles.headerText}>REASON</Text>
                </View>
                <View style={styles.submittedCol}>
                  <Text style={styles.headerText}>SUBMITTED ON</Text>
                </View>
                <View style={styles.actionsCol}>
                  <Text style={styles.headerText}>ACTIONS</Text>
                </View>
              </View>

              {/* Table Rows */}
              {pendingResignations.map((resignation, index) => 
                renderTableRow(resignation, index, true)
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* All Resignations Table */}
      <View style={styles.tableSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            All Resignation Records ({allResignations.length})
          </Text>
        </View>
        
        <View style={styles.searchAndFilterContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search employees..."
                placeholderTextColor="#999"
                value={searchTerm}
                onChangeText={handleSearch}
              />
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Icon name="filter-list" size={20} color="#666" />
              <Text style={styles.filterText}>Filters</Text>
            </TouchableOpacity>
          </View>
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
                  { value: 'Requested', label: 'Requested' },
                  { value: 'Accepted', label: 'Accepted' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={filters.status}
                onChange={(value) => onFilterChange({ ...filters, status: value })}
                containerStyle={styles.filterSelect}
              />
              
              <SearchableSelect
                label="Separation Type"
                placeholder="All Types"
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'Resigned', label: 'Resigned' },
                  { value: 'Terminated', label: 'Terminated' },
                ]}
                value={filters.separationType}
                onChange={(value) => onFilterChange({ ...filters, separationType: value })}
                containerStyle={styles.filterSelect}
              />
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.srCol}>
                <Text style={styles.headerText}>#</Text>
              </View>
              <View style={styles.employeeCol}>
                <Text style={styles.headerText}>EMPLOYEE</Text>
              </View>
              <View style={styles.designationCol}>
                <Text style={styles.headerText}>DESIGNATION</Text>
              </View>
              <View style={styles.typeCol}>
                <Text style={styles.headerText}>TYPE</Text>
              </View>
              <View style={styles.effectiveCol}>
                <Text style={styles.headerText}>EFFECTIVE FROM</Text>
              </View>
              <View style={styles.lastDayCol}>
                <Text style={styles.headerText}>LAST WORKING DAY</Text>
              </View>
              <View style={styles.reasonCol}>
                <Text style={styles.headerText}>REASON</Text>
              </View>
              <View style={styles.submittedCol}>
                <Text style={styles.headerText}>SUBMITTED ON</Text>
              </View>
              <View style={styles.statusCol}>
                <Text style={styles.headerText}>STATUS</Text>
              </View>
              <View style={styles.actionsCol}>
                <Text style={styles.headerText}>ACTIONS</Text>
              </View>
            </View>

            {/* Table Rows */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              allResignations.map((resignation, index) => 
                renderTableRow(resignation, index, false)
              )
            )}
          </View>
        </ScrollView>

        {/* Pagination */}
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </Text>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
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
  tableSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchAndFilterContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'column',
    gap: 12,
  },
  searchRow: {
    marginBottom: 8,
  },
  filterRow: {
    alignItems: 'flex-start',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
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
    minWidth: 1400,
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
  srCol: { width: 50, paddingHorizontal: 8, justifyContent: 'center' },
  employeeCol: { width: 150, paddingHorizontal: 8, justifyContent: 'center' },
  designationCol: { width: 150, paddingHorizontal: 8, justifyContent: 'center' },
  typeCol: { width: 120, paddingHorizontal: 8, justifyContent: 'center' },
  effectiveCol: { width: 120, paddingHorizontal: 8, justifyContent: 'center' },
  lastDayCol: { width: 120, paddingHorizontal: 8, justifyContent: 'center' },
  reasonCol: { width: 200, paddingHorizontal: 8, justifyContent: 'center' },
  submittedCol: { width: 120, paddingHorizontal: 8, justifyContent: 'center' },
  statusCol: { width: 100, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  actionsCol: { width: 120, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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

export default ResignationTable;
