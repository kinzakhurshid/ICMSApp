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
import useAxios from '../hooks/useAxios';
import { exportToXlsx } from '../utills/utills';
import SearchableSelect from './SearchableSelect';

interface AssignmentTableProps {
  assignments: any[];
  page: number;
  totalPages: number;
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onSearchSubmit: () => void;
  onPageChange: (page: number) => void;
  onLoadAllAssignments: () => Promise<any>;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  onRefresh?: () => void;
}

const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  page,
  totalPages,
  search,
  status,
  onSearchChange,
  onStatusChange,
  onSearchSubmit,
  onPageChange,
  onLoadAllAssignments,
  limit = 10,
  onLimitChange,
  onRefresh,
}) => {
  const { callApi } = useAxios();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    onSearchChange(text);
  };

  const handleSelectAssignment = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(assignmentId => assignmentId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === assignments.length && assignments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assignments.map(assignment => assignment._id));
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await onLoadAllAssignments();
      const allData = Array.isArray(response?.data) ? response.data : response || [];

      if (!allData || allData.length === 0) {
        Alert.alert('Export', 'No assignments to export');
        return;
      }

      await exportToXlsx({
        filename: `assignments-${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'accessory', header: 'Accessory' },
          { key: 'employee', header: 'Employee' },
          { key: 'issuedDate', header: 'Issued Date' },
          { key: 'conditionIssued', header: 'Condition Issued' },
          { key: 'returnedDate', header: 'Returned Date' },
          { key: 'conditionReturned', header: 'Condition Returned' },
          { key: 'status', header: 'Status' },
        ],
        rows: allData.map((assignment: any, index: number) => ({
          sr: index + 1,
          accessory: assignment.accessory?.name || 'N/A',
          employee: assignment.employee?.name || 
                   assignment.employee?.fullName ||
                   `${assignment.employee?.firstName || ''} ${assignment.employee?.lastName || ''}`.trim() ||
                   'N/A',
          issuedDate: formatDate(assignment.issuedDate),
          conditionIssued: assignment.conditionIssued || 'N/A',
          returnedDate: assignment.returnedDate ? formatDate(assignment.returnedDate) : 'TBR',
          conditionReturned: assignment.conditionReturned || 'TBR',
          status: assignment.status || 'issued',
        })),
      });

      Alert.alert('Success', 'Assignments exported successfully');
    } catch (error) {
      console.error('Error exporting assignments:', error);
      Alert.alert('Error', 'Failed to export assignments');
    } finally {
      setExporting(false);
    }
  };

  const handleUnassign = (assignment: any) => {
    Alert.alert(
      'Unassign Accessory',
      `Are you sure you want to unassign ${assignment.accessory?.name || 'this accessory'} from ${assignment.employee?.name || assignment.employee?.fullName || 'the employee'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue',
          style: 'destructive', 
          onPress: () => {
            // Ask for condition on return
            Alert.alert(
              'Condition on Return',
              'Select the condition of the accessory when returning it:',
              [
                { text: 'New', onPress: () => performUnassign(assignment, 'new') },
                { text: 'Good', onPress: () => performUnassign(assignment, 'good') },
                { text: 'Damaged', onPress: () => performUnassign(assignment, 'damaged') },
                { text: 'Lost', onPress: () => performUnassign(assignment, 'lost') },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          },
        },
      ],
    );
  };

  const performUnassign = async (assignment: any, conditionOnReturn: 'new' | 'good' | 'damaged' | 'lost') => {
            try {
              setUnassigning(assignment._id);
              await callApi({
        method: 'POST',
        url: '/accessories/return',
        data: {
          assignmentId: assignment._id,
          conditionOnReturn,
          conditionDescription: '',
        },
              });
              Alert.alert('Success', 'Accessory unassigned successfully');
              if (onRefresh) {
                onRefresh();
              }
            } catch (error: any) {
              console.error('Error unassigning accessory:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to unassign accessory');
            } finally {
              setUnassigning(null);
            }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const total = assignments.length; // Should come from API pagination

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Assignments ({total})</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={handleSearchChange}
              onSubmitEditing={onSearchSubmit}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="download" size={16} color="white" />
                <Text style={styles.exportText}>Export All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <SearchableSelect
            label="Status"
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'issued', label: 'Issued' },
              { value: 'returned', label: 'Returned' },
            ]}
            value={status}
            onChange={onStatusChange}
            containerStyle={styles.filterSelect}
          />
        </View>
      )}

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <Icon 
                name={selectedIds.length === assignments.length && assignments.length > 0 ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.srCol]}>#</Text>
            <Text style={[styles.headerText, styles.accessoryCol]}>ACCESSORY</Text>
            <Text style={[styles.headerText, styles.employeeCol]}>EMPLOYEE</Text>
            <Text style={[styles.headerText, styles.issuedCol]}>ISSUED</Text>
            <Text style={[styles.headerText, styles.conditionIssuedCol]}>CONDITION ISSUED</Text>
            <Text style={[styles.headerText, styles.returnedCol]}>RETURNED</Text>
            <Text style={[styles.headerText, styles.conditionReturnedCol]}>CONDITION RETURNED</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.actionCol]}>ACTION</Text>
          </View>

          {/* Table Rows */}
          {assignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No assignments found</Text>
            </View>
          ) : (
            assignments.map((assignment, index) => (
              <View key={assignment._id} style={styles.tableRow}>
                <TouchableOpacity 
                  style={styles.checkboxCell}
                  onPress={() => handleSelectAssignment(assignment._id)}
                >
                  <Icon 
                    name={selectedIds.includes(assignment._id) ? "check-box" : "check-box-outline-blank"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                <Text style={[styles.cellText, styles.srCol]}>{(page - 1) * limit + index + 1}</Text>
                <Text style={[styles.cellText, styles.accessoryCol]}>{assignment.accessory?.name || 'N/A'}</Text>
                <Text style={[styles.cellText, styles.employeeCol]}>
                  {assignment.employee?.name || 
                   assignment.employee?.fullName ||
                   `${assignment.employee?.firstName || ''} ${assignment.employee?.lastName || ''}`.trim() ||
                   'N/A'}
                </Text>
                <Text style={[styles.cellText, styles.issuedCol]}>{formatDate(assignment.issuedDate)}</Text>
                <Text style={[styles.cellText, styles.conditionIssuedCol]}>{assignment.conditionIssued || 'N/A'}</Text>
                <Text style={[styles.cellText, styles.returnedCol]}>{assignment.returnedDate ? formatDate(assignment.returnedDate) : 'TBR'}</Text>
                <Text style={[styles.cellText, styles.conditionReturnedCol]}>{assignment.conditionReturned || 'TBR'}</Text>
                
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: assignment.status === 'issued' ? '#FFF3CD' : '#D4EDDA' }]}>
                    <Text style={[styles.statusText, { color: assignment.status === 'issued' ? '#856404' : '#155724' }]}>
                      {assignment.status || 'issued'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, unassigning === assignment._id && styles.actionButtonDisabled]}
                    onPress={() => handleUnassign(assignment)}
                    disabled={unassigning === assignment._id}
                  >
                    {unassigning === assignment._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.actionButtonText}>Unassign Now</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationInfo}>
            Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total}
          </Text>
          <View style={styles.paginationControls}>
            <View style={styles.paginationButtons}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={() => {
                  if (page > 1) {
                    onPageChange(page - 1);
                  }
                }}
                disabled={page === 1}
              >
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>
              <Text style={styles.paginationPageText}>
                Page {page} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, page >= totalPages && styles.paginationButtonDisabled]}
                onPress={() => {
                  if (page < totalPages) {
                    onPageChange(page + 1);
                  }
                }}
                disabled={page >= totalPages}
              >
                <Text style={[styles.paginationButtonText, (page >= totalPages) && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    flexDirection: 'column',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
    flex: 1,
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
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSelect: {
    flex: 1,
    minWidth: 200,
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
  checkboxHeader: {
    width: 40,
    alignItems: 'center',
  },
  srCol: { width: 50, alignItems: 'center' },
  accessoryCol: { width: 150 },
  employeeCol: { width: 150 },
  issuedCol: { width: 120 },
  conditionIssuedCol: { width: 140 },
  returnedCol: { width: 120 },
  conditionReturnedCol: { width: 140 },
  statusCol: { width: 100 },
  actionCol: { width: 120 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  checkboxCell: {
    width: 40,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  statusContainer: {
    width: 100,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    width: 120,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  paginationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  paginationControls: {
    flexDirection: 'column',
    gap: 12,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
  },
  paginationButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationPageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 80,
    textAlign: 'center',
  },
  limitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  limitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  limitButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  limitButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  limitButtonTextActive: {
    color: 'white',
  },
});

export default AssignmentTable;
