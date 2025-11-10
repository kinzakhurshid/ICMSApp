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
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAssignment = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(assignmentId => assignmentId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === assignments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assignments.map(assignment => assignment._id));
    }
  };

  const handleExport = async () => {
    try {
      const allData = await onLoadAllAssignments();
      Alert.alert('Export', 'Export functionality will be implemented');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleUnassign = (assignment: any) => {
    Alert.alert(
      'Unassign Accessory',
      `Are you sure you want to unassign ${assignment.accessory?.name} from ${assignment.employee?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unassign', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'Accessory unassigned successfully');
        }},
      ]
    );
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Assignments</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Icon name="download" size={16} color="white" />
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <Icon 
                name={selectedIds.length === assignments.length ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
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
          {assignments.map((assignment) => (
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
              
              <Text style={[styles.cellText, styles.accessoryCol]}>{assignment.accessory?.name || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.employeeCol]}>{assignment.employee?.name || 'N/A'}</Text>
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
                  style={styles.actionButton}
                  onPress={() => handleUnassign(assignment)}
                >
                  <Text style={styles.actionButtonText}>Unassign Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  exportText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
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
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AssignmentTable;





