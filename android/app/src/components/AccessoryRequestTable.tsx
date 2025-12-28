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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { exportToXlsx } from '../utills/utills';
import SearchableSelect from './SearchableSelect';
import useAxios from '../hooks/useAxios';

interface AccessoryRequestTableProps {
  requests: any[];
  page: number;
  totalPages: number;
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onSearchSubmit: () => void;
  onPageChange: (page: number) => void;
  onLoadAllRequests: () => Promise<any>;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  /** Show the employee column (HR view). For employee dashboard, pass false to hide it. */
  showEmployeeColumn?: boolean;
}

const AccessoryRequestTable: React.FC<AccessoryRequestTableProps> = ({
  requests,
  page,
  totalPages,
  search,
  status,
  onSearchChange,
  onStatusChange,
  onSearchSubmit,
  onPageChange,
  onLoadAllRequests,
  limit = 10,
  onLimitChange,
  showEmployeeColumn = true,
}) => {
  const [searchTerm, setSearchTerm] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const { callApi } = useAxios();

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    onSearchChange(text);
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

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await onLoadAllRequests();
      const allData = Array.isArray(response?.data) ? response.data : response || [];

      if (!allData || allData.length === 0) {
        Alert.alert('Export', 'No accessory requests to export');
        return;
      }

      await exportToXlsx({
        filename: `accessory-requests-${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'employee', header: 'EMPLOYEE' },
          { key: 'subject', header: 'SUBJECT' },
          { key: 'description', header: 'DESCRIPTION' },
          { key: 'status', header: 'STATUS' },
          { key: 'createdAt', header: 'CREATED AT' },
        ],
        rows: allData.map((req: any, index: number) => ({
          sr: index + 1,
          employee:
            req.employee?.fullName ||
            req.employee?.name ||
            `${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`.trim() ||
            'N/A',
          subject: req.subject || 'N/A',
          description: req.description || '',
          status: req.status || 'N/A',
          createdAt: formatDate(req.createdAt),
        })),
      });

      Alert.alert('Success', 'Accessory requests exported successfully');
    } catch (error) {
      console.error('Error exporting accessory requests:', error);
      Alert.alert('Error', 'Failed to export accessory requests');
    } finally {
      setExporting(false);
    }
  };

  const startEdit = (req: any) => {
    setEditingRequest(req);
    setEditSubject(req.subject || '');
    setEditDescription(req.description || '');
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditSubject('');
    setEditDescription('');
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    if (!editSubject.trim() || !editDescription.trim()) {
      Alert.alert('Validation', 'Subject and description are required');
      return;
    }

    try {
      setSavingEdit(true);
      await callApi({
        method: 'PUT',
        url: `/accessory-requests/${editingRequest._id}`,
        data: {
          subject: editSubject.trim(),
          description: editDescription.trim(),
        },
      });

      Alert.alert('Success', 'Accessory request updated successfully');

      if (onPageChange) {
        onPageChange(page);
      } else if (onSearchSubmit) {
        onSearchSubmit();
      }

      handleCancelEdit();
    } catch (error: any) {
      console.error('Error updating accessory request:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Failed to update accessory request',
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const total = requests.length; // local count; API total is in totalPages/page props

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Accessory Requests ({total})</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search requests..."
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
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={status}
            onChange={onStatusChange}
            containerStyle={styles.filterSelect}
          />
        </View>
      )}

      {/* Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.tableScrollContainer}
      >
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.srCol]}>#</Text>
            {showEmployeeColumn && (
              <Text style={[styles.headerText, styles.employeeCol]}>EMPLOYEE</Text>
            )}
            <Text style={[styles.headerText, styles.subjectCol]}>SUBJECT</Text>
            <Text style={[styles.headerText, styles.descriptionCol]}>DESCRIPTION</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.dateCol]}>CREATED AT</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No accessory requests found</Text>
            </View>
          ) : (
            requests.map((req: any, index: number) => (
              <View key={req._id || index} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.srCol]}>{(page - 1) * limit + index + 1}</Text>
                {showEmployeeColumn && (
                  <Text style={[styles.cellText, styles.employeeCol]} numberOfLines={1}>
                    {req.employee?.fullName ||
                      req.employee?.name ||
                      `${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`.trim() ||
                      'N/A'}
                  </Text>
                )}
                <Text style={[styles.cellText, styles.subjectCol]} numberOfLines={1}>
                  {req.subject || 'N/A'}
                </Text>
                <Text style={[styles.cellText, styles.descriptionCol]} numberOfLines={2}>
                  {req.description || ''}
                </Text>
                <View style={[styles.statusCol, styles.statusBadgeWrapper]}>
                  <View style={[styles.statusBadge, styles[`status_${(req.status || '').toLowerCase()}`]]}>
                    <Text style={styles.statusBadgeText}>{(req.status || 'N/A').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.cellText, styles.dateCol]}>
                  {formatDate(req.createdAt)}
                </Text>
                <View style={styles.actionsCol}>
                  {(req.status || '').toLowerCase() === 'pending' && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => startEdit(req)}
                    >
                      <Icon name="edit" size={18} color="#FF6B35" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit modal */}
      <Modal
        visible={!!editingRequest}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Accessory Request</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Subject"
              value={editSubject}
              onChangeText={setEditSubject}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelEdit}
                disabled={savingEdit}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <View style={styles.limitContainer}>
          <Text style={styles.paginationText}>Rows per page:</Text>
          <View style={styles.limitButtons}>
            {[10, 20, 50].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.limitButton, limit === val && styles.limitButtonActive]}
                onPress={() => onLimitChange && onLimitChange(val)}
              >
                <Text
                  style={[
                    styles.limitButtonText,
                    limit === val && styles.limitButtonTextActive,
                  ]}
                >
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            disabled={page === 1}
            onPress={() => onPageChange(page - 1)}
          >
            <Icon name="chevron-left" size={20} color={page === 1 ? '#ccc' : '#111827'} />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {page} of {totalPages || 1}
          </Text>
          <TouchableOpacity
            style={[
              styles.pageButton,
              (totalPages === 0 || page === totalPages) && styles.pageButtonDisabled,
            ]}
            disabled={totalPages === 0 || page === totalPages}
            onPress={() => onPageChange(page + 1)}
          >
            <Icon
              name="chevron-right"
              size={20}
              color={totalPages === 0 || page === totalPages ? '#ccc' : '#111827'}
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  exportButtonDisabled: {
    backgroundColor: '#FDBA74',
  },
  exportText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 12,
  },
  filterSelect: {
    flex: 1,
  },
  tableScrollContainer: {
    marginTop: 8,
  },
  tableContainer: {
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cellText: {
    fontSize: 13,
    color: '#111827',
    paddingRight: 8,
  },
  srCol: {
    width: 40,
  },
  employeeCol: {
    width: 160,
  },
  subjectCol: {
    width: 200,
  },
  descriptionCol: {
    width: 260,
  },
  statusCol: {
    width: 140,
  },
  dateCol: {
    width: 120,
  },
  actionsCol: {
    width: 120,
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  paginationContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  pageButton: {
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pageButtonDisabled: {
    borderColor: '#E5E7EB',
  },
  limitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  limitButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  limitButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  limitButtonText: {
    fontSize: 12,
    color: '#4B5563',
  },
  limitButtonTextActive: {
    color: '#FFFFFF',
  },
  statusBadgeWrapper: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  status_pending: {
    backgroundColor: '#FEF3C7',
  },
  status_approved: {
    backgroundColor: '#DCFCE7',
  },
  status_rejected: {
    backgroundColor: '#FEE2E2',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FF6B35',
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  modalTextarea: {
    minHeight: 80,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 13,
    color: '#374151',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FF6B35',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AccessoryRequestTable;


