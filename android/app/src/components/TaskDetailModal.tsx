import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';

interface Task {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  progress?: number; // 0-100
  status?: string;
  priority?: string;
}

interface TaskDetailModalProps {
  visible: boolean;
  taskId: string | null;
  onClose: () => void;
  onEdit?: (taskId: string) => void;
  onRefresh?: () => void;
}

export default function TaskDetailModal({
  visible,
  taskId,
  onClose,
  onEdit,
  onRefresh,
}: TaskDetailModalProps) {
  const { callApi } = useAxios();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    if (visible && taskId) {
      fetchTask();
    } else {
      setTask(null);
      setProgressInput('');
    }
  }, [visible, taskId]);

  const fetchTask = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/task/${taskId}`,
      });
      
      // Handle different response formats
      const taskData = response?.task || response?.data || response;
      
      if (taskData && taskData._id) {
        setTask(taskData);
        // Set progress input if task has progress
        if (taskData.progress !== undefined && taskData.progress !== null) {
          setProgressInput(String(taskData.progress));
        } else {
          setProgressInput('0');
        }
      } else {
        Alert.alert('Error', 'Failed to load task details');
        onClose();
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!taskId) return;

    const progress = Number(progressInput);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      Alert.alert('Error', 'Progress must be a number between 0 and 100');
      return;
    }

    try {
      setUpdatingProgress(true);
      const response = await callApi({
        method: 'PATCH',
        url: `/task/${taskId}/progress`,
        data: { progress },
      });
      
      if (response?.success !== false) {
        Alert.alert('Success', 'Progress updated successfully');
        fetchTask(); // Refresh task data
        onRefresh?.();
      } else {
        Alert.alert('Error', 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingText}>Loading task details...</Text>
            </View>
          ) : task ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.title} numberOfLines={2}>
                    {task.title}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Task Details Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Task Details</Text>
                  <View style={styles.detailsGrid}>
                    {/* Left Column */}
                    <View style={styles.detailsColumn}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={20} color="#f97316" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Start Date</Text>
                          <Text style={styles.detailValue}>{formatDate(task.startDate)}</Text>
                        </View>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={20} color="#3b82f6" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Estimated Hours</Text>
                          <Text style={styles.detailValue}>{task.estimatedHours || 0}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Right Column */}
                    <View style={styles.detailsColumn}>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={20} color="#f97316" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Due Date</Text>
                          <Text style={styles.detailValue}>{formatDate(task.dueDate)}</Text>
                        </View>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={20} color="#3b82f6" />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Actual Hours</Text>
                          <Text style={styles.detailValue}>{task.actualHours || 0}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Task Progress Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Task Progress</Text>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${task.progress || 0}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressPercentage}>{task.progress || 0}%</Text>
                  </View>

                  {/* Progress Input */}
                  <View style={styles.progressInputContainer}>
                    <TextInput
                      style={styles.progressInput}
                      value={progressInput}
                      onChangeText={setProgressInput}
                      keyboardType="numeric"
                      placeholder="0-100"
                      placeholderTextColor="#9ca3af"
                    />
                    <View style={styles.progressArrows}>
                      <TouchableOpacity
                        onPress={() => {
                          const val = Math.max(0, Number(progressInput || 0) - 1);
                          setProgressInput(String(val));
                        }}
                        style={styles.arrowButton}
                      >
                        <Ionicons name="chevron-up" size={16} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const val = Math.min(100, Number(progressInput || 0) + 1);
                          setProgressInput(String(val));
                        }}
                        style={styles.arrowButton}
                      >
                        <Ionicons name="chevron-down" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.progressHint}>Enter 0-100</Text>

                  {/* Update Progress Button */}
                  <TouchableOpacity
                    style={[
                      styles.updateProgressButton,
                      (updatingProgress || !progressInput.trim()) && styles.updateProgressButtonDisabled
                    ]}
                    onPress={handleUpdateProgress}
                    disabled={updatingProgress || !progressInput.trim()}
                  >
                    {updatingProgress ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.updateProgressButtonText}>Update Progress</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Description */}
                {task.description && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{task.description}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.footer}>
                {onEdit && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      onClose();
                      onEdit(task._id);
                    }}
                    disabled={actionLoading}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButtonFooter}
                  onPress={onClose}
                  disabled={actionLoading}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>Failed to load task details</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchTask}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailsColumn: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
  },
  progressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#111827',
  },
  progressArrows: {
    flexDirection: 'column',
    gap: 2,
  },
  arrowButton: {
    padding: 4,
  },
  progressHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  updateProgressButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    // Gradient effect simulation
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  updateProgressButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateProgressButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  closeButtonFooter: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

