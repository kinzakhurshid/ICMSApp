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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';

interface AccessoryTableProps {
  accessories: any[];
  onAccessoriesUpdate: (accessories: any[]) => void;
}

const AccessoryTable: React.FC<AccessoryTableProps> = ({
  accessories,
  onAccessoriesUpdate,
}) => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredAccessories = accessories.filter(accessory =>
    accessory.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accessory.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accessory.condition?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAccessory = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(accessoryId => accessoryId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAccessories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccessories.map(accessory => accessory._id));
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
          onPress: () => deleteAccessory(accessory._id),
        },
      ],
    );
  };

  const deleteAccessory = async (id: string) => {
    try {
      await callApi({ method: 'DELETE', url: `/accessories/${id}` });
      const updatedAccessories = accessories.filter(accessory => accessory._id !== id);
      onAccessoriesUpdate(updatedAccessories);
      Alert.alert('Success', 'Accessory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting accessory:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to delete accessory');
    }
  };

  const handleEditAccessory = (accessory: any) => {
    (navigation as any).navigate('EditAccessory', { accessoryId: accessory._id });
  };

  const handleAssignAccessory = (accessory: any) => {
    if (accessory.status !== 'available') {
      Alert.alert('Error', 'This accessory is not available for assignment');
      return;
    }
    (navigation as any).navigate('AssignAccessory');
  };

  const handleReturnAccessory = (accessory: any) => {
    if (accessory.status === 'available') {
      Alert.alert('Error', 'This accessory is not currently assigned');
      return;
    }
    (navigation as any).navigate('ReturnAccessory', { accessoryId: accessory._id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>All Accessories</Text>
          <TouchableOpacity 
            style={styles.addAccessoryButton}
            onPress={() => (navigation as any).navigate('CreateAccessory')}
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
              onChangeText={setSearchTerm}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton}>
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
                name={selectedIds.length === filteredAccessories.length ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.nameCol]}>NAME</Text>
            <Text style={[styles.headerText, styles.categoryCol]}>CATEGORY</Text>
            <Text style={[styles.headerText, styles.conditionCol]}>CONDITION</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.assignedToCol]}>ASSIGNED TO</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {filteredAccessories.map((accessory) => (
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
              
              <Text style={[styles.cellText, styles.nameCol]}>{accessory.name || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.categoryCol]}>{accessory.category || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.conditionCol]}>{accessory.condition || 'N/A'}</Text>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { 
                  backgroundColor: accessory.status === 'available' ? '#D4EDDA' : '#FFF3CD' 
                }]}>
                  <Text style={[styles.statusText, { 
                    color: accessory.status === 'available' ? '#155724' : '#856404' 
                  }]}>
                    {accessory.status || 'available'}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.cellText, styles.assignedToCol]}>
                {accessory.assignedTo || 'Unassigned'}
              </Text>
              
              <View style={styles.actionsContainer}>
                {/* Show Assign only if available, Return only if assigned */}
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
});

export default AccessoryTable;





