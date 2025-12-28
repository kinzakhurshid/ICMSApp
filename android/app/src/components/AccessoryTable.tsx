import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { exportToXlsx } from '../utills/utills';
import SearchableSelect from './SearchableSelect';

interface AccessoryTableProps {
  accessories: any[];
  onAccessoriesUpdate: (accessories: any[]) => void;
  page?: number;
  totalPages?: number;
  limit?: number;
  search?: string;
  statusFilter?: string;
  categoryFilter?: string;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSearchChange?: (search: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onCategoryFilterChange?: (category: string) => void;
  onLoadAllAccessories?: () => Promise<any[]>;
  onRefresh?: () => void;
  categories?: string[];
}

const AccessoryTable: React.FC<AccessoryTableProps> = ({
  accessories,
  onAccessoriesUpdate,
  page = 1,
  totalPages = 1,
  limit = 10,
  search = '',
  statusFilter = '',
  categoryFilter = '',
  onPageChange,
  onLimitChange,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onLoadAllAccessories,
  onRefresh,
  categories = [],
}) => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [searchTerm, setSearchTerm] = useState(search);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    if (onSearchChange) {
      onSearchChange(text);
    }
  };

  const handleSelectAccessory = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(accessoryId => accessoryId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === accessories.length && accessories.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accessories.map(accessory => accessory._id));
    }
  };

  const handleDeleteAccessory = (accessory: any) => {
    if (accessory.status === 'in-use' || accessory.status === 'in_use') {
      Alert.alert('Cannot Delete', 'This accessory is currently in use and cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete Accessory',
      'Are you sure you want to delete this accessory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await callApi({ method: 'DELETE', url: `/accessories/${accessory._id}` });
              if (onRefresh) {
                onRefresh();
              } else {
                const updatedAccessories = accessories.filter(a => a._id !== accessory._id);
                onAccessoriesUpdate(updatedAccessories);
              }
              Alert.alert('Success', 'Accessory deleted successfully');
            } catch (error: any) {
              console.error('Error deleting accessory:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete accessory');
            }
          },
        },
      ],
    );
  };

  const handleEditAccessory = (accessory: any) => {
    (navigation as any).navigate('EditAccessory', { 
      accessoryId: accessory._id,
      redirectTo: 'AccessoriesScreen',
    });
  };

  const handleAssignAccessory = (accessory: any) => {
    if (accessory.status !== 'available' && accessory.status !== 'Available') {
      Alert.alert('Error', 'This accessory is not available for assignment');
      return;
    }
    (navigation as any).navigate('AssignAccessory', { 
      accessoryId: accessory._id,
      redirectTo: 'AccessoriesScreen',
    });
  };

  const handleReturnAccessory = (accessory: any) => {
    if (accessory.status === 'available' || accessory.status === 'Available') {
      Alert.alert('Error', 'This accessory is not currently assigned');
      return;
    }
    (navigation as any).navigate('ReturnAccessory', { 
      accessoryId: accessory._id,
      redirectTo: 'AccessoriesScreen',
    });
  };

  const handleExport = async () => {
    if (!onLoadAllAccessories) {
      Alert.alert('Error', 'Export functionality not available');
      return;
    }

    try {
      setExporting(true);
      const allAccessories = await onLoadAllAccessories();

      if (!allAccessories || allAccessories.length === 0) {
        Alert.alert('Export', 'No accessories to export');
        return;
      }

      await exportToXlsx({
        filename: `accessories-${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'name', header: 'Name' },
          { key: 'category', header: 'Category' },
          { key: 'condition', header: 'Condition' },
          { key: 'status', header: 'Status' },
          { key: 'assignedTo', header: 'Assigned To' },
        ],
        rows: allAccessories.map((accessory, index) => ({
          sr: index + 1,
          name: accessory.name || 'N/A',
          category: accessory.category || 'N/A',
          condition: accessory.condition || 'N/A',
          status: accessory.status || 'N/A',
          assignedTo: accessory.assignedTo || accessory.assignedEmployee?.name || 'Unassigned',
        })),
      });

      Alert.alert('Success', 'Accessories exported successfully');
    } catch (error) {
      console.error('Error exporting accessories:', error);
      Alert.alert('Error', 'Failed to export accessories');
    } finally {
      setExporting(false);
    }
  };

  const total = accessories.length; // This should come from API pagination, but using length for now

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>All Accessories ({total})</Text>
          <TouchableOpacity 
            style={styles.addAccessoryButton}
            onPress={() => (navigation as any).navigate('CreateAccessory', { redirectTo: 'AccessoriesScreen' })}
          >
            <Icon name="add" size={18} color="white" />
            <Text style={styles.addAccessoryButtonText}>Add Accessory</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search accessories..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={handleSearchChange}
              onSubmitEditing={() => {
                if (onSearchChange) {
                  onSearchChange(searchTerm);
                }
              }}
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
          <View style={styles.filterRow}>
            <SearchableSelect
              label="Status"
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'available', label: 'Available' },
                { value: 'in-use', label: 'In Use' },
                { value: 'damaged', label: 'Damaged' },
                { value: 'lost', label: 'Lost' },
              ]}
              value={statusFilter}
              onChange={(value) => {
                if (onStatusFilterChange) {
                  onStatusFilterChange(value);
                }
              }}
              containerStyle={styles.filterSelect}
            />
            <SearchableSelect
              label="Category"
              placeholder="All Categories"
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat, label: cat })),
              ]}
              value={categoryFilter}
              onChange={(value) => {
                if (onCategoryFilterChange) {
                  onCategoryFilterChange(value);
                }
              }}
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
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <Icon 
                name={selectedIds.length === accessories.length && accessories.length > 0 ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.srCol]}>#</Text>
            <Text style={[styles.headerText, styles.nameCol]}>NAME</Text>
            <Text style={[styles.headerText, styles.categoryCol]}>CATEGORY</Text>
            <Text style={[styles.headerText, styles.conditionCol]}>CONDITION</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.assignedToCol]}>ASSIGNED TO</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {accessories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No accessories found</Text>
            </View>
          ) : (
            accessories.map((accessory, index) => (
              <View key={accessory._id} style={styles.tableRow}>
                <TouchableOpacity 
                  style={styles.checkboxCell}
                  onPress={() => handleSelectAccessory(accessory._id)}
                >
                  <Icon 
                    name={selectedIds.includes(accessory._id) ? "check-box" : "check-box-outline-blank"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                <Text style={[styles.cellText, styles.srCol]}>{(page - 1) * limit + index + 1}</Text>
                <Text style={[styles.cellText, styles.nameCol]}>{accessory.name || 'N/A'}</Text>
                <Text style={[styles.cellText, styles.categoryCol]}>{accessory.category || 'N/A'}</Text>
                <Text style={[styles.cellText, styles.conditionCol]}>{accessory.condition || 'N/A'}</Text>
                
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: accessory.status === 'available' ? '#D4EDDA' : 
                                    accessory.status === 'in-use' || accessory.status === 'in_use' ? '#FFF3CD' :
                                    '#F8D7DA'
                  }]}>
                    <Text style={[styles.statusText, { 
                      color: accessory.status === 'available' ? '#155724' : 
                             accessory.status === 'in-use' || accessory.status === 'in_use' ? '#856404' :
                             '#721C24'
                    }]}>
                      {accessory.status || 'available'}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.cellText, styles.assignedToCol]}>
                  {accessory.assignedTo || accessory.assignedEmployee?.name || 'Unassigned'}
                </Text>
                
                <View style={styles.actionsContainer}>
                  {accessory.status === 'available' || accessory.status === 'Available' ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAssignAccessory(accessory)}
                    >
                      <Text style={styles.actionButtonText}>Assign</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.returnButton]}
                      onPress={() => handleReturnAccessory(accessory)}
                    >
                      <Text style={styles.actionButtonText}>Return</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditAccessory(accessory)}
                  >
                    <Icon name="edit" size={16} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAccessory(accessory)}
                  >
                    <Icon name="delete" size={16} color="#DC2626" />
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
                  if (onPageChange && page > 1) {
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
                  if (onPageChange && page < totalPages) {
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addAccessoryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addAccessoryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  filterRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  filterSelect: {
    flex: 1,
    minWidth: 150,
  },
  tableScrollContainer: {
    maxHeight: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    minWidth: 1000,
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
  nameCol: { width: 200 },
  categoryCol: { width: 150 },
  conditionCol: { width: 120 },
  statusCol: { width: 120 },
  assignedToCol: { width: 150 },
  actionsCol: { width: 200 },
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
    width: 120,
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
  actionsContainer: {
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  returnButton: {
    backgroundColor: '#28A745',
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
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

export default AccessoryTable;
