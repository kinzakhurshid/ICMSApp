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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';

interface Meeting {
  _id: string;
  name: string;
  description: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  meetingLink: string;
  participants: Array<{ _id?: string; id?: string; fullName?: string; name?: string; email?: string; firstName?: string; lastName?: string; employee?: any; user?: any } | string>;
  createdBy: {
    _id: string;
    fullName: string;
  };
  isCompleted?: boolean;
  isCancelled?: boolean;
}

interface MeetingDetailModalProps {
  visible: boolean;
  meetingId: string | null;
  onClose: () => void;
  onEdit?: (meetingId: string) => void;
  onRefresh?: () => void;
}

export default function MeetingDetailModal({
  visible,
  meetingId,
  onClose,
  onEdit,
  onRefresh,
}: MeetingDetailModalProps) {
  const { callApi } = useAxios();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible && meetingId) {
      loadMeeting();
    } else {
      setMeeting(null);
    }
  }, [visible, meetingId]);

  const loadMeeting = async () => {
    if (!meetingId) return;

    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/meetings/${meetingId}`,
      });
      
      const meetingData = response.data || response;
      
      // Log participants data to debug
      console.log('🔍 Meeting participants raw data:', JSON.stringify(meetingData.participants, null, 2));
      
      // Normalize participants - handle different data formats
      if (meetingData.participants) {
        meetingData.participants = meetingData.participants.map((p: any) => {
          // If participant is just an ID string, return it as is (will handle separately)
          if (typeof p === 'string') {
            return { _id: p, fullName: 'Loading...', isIdOnly: true };
          }
          
          // If participant is an object, extract name
          const fullName = 
            p.fullName || 
            p.name || 
            (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : null) ||
            (p.employee?.fullName) ||
            (p.employee?.firstName && p.employee?.lastName ? `${p.employee.firstName} ${p.employee.lastName}` : null) ||
            (p.user?.fullName) ||
            (p.user?.name) ||
            'Unknown';
          
          return {
            _id: p._id || p.id || p.employee?._id || p.user?._id || '',
            fullName: fullName,
            email: p.email || p.employee?.email || p.user?.email || '',
          };
        });
      }
      
      console.log('🔍 Normalized participants:', JSON.stringify(meetingData.participants, null, 2));
      
      setMeeting(meetingData);
    } catch (error) {
      console.error('Error loading meeting:', error);
      Alert.alert('Error', 'Failed to load meeting details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!meetingId) return;

    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this meeting as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              await callApi({
                method: 'PATCH',
                url: `/meetings/${meetingId}/complete`,
              });
              Alert.alert('Success', 'Meeting marked as completed');
              onRefresh?.();
              loadMeeting();
            } catch (error) {
              console.error('Error completing meeting:', error);
              Alert.alert('Error', 'Failed to mark meeting as completed');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!meetingId) return;

    Alert.alert(
      'Cancel Meeting',
      'Are you sure you want to cancel this meeting?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await callApi({
                method: 'PATCH',
                url: `/meetings/${meetingId}/cancel`,
              });
              Alert.alert('Success', 'Meeting cancelled');
              onRefresh?.();
              loadMeeting();
            } catch (error) {
              console.error('Error cancelling meeting:', error);
              Alert.alert('Error', 'Failed to cancel meeting');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!meetingId) return;

    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await callApi({
                method: 'DELETE',
                url: `/meetings/${meetingId}`,
              });
              Alert.alert('Success', 'Meeting deleted successfully');
              onRefresh?.();
              onClose();
            } catch (error) {
              console.error('Error deleting meeting:', error);
              Alert.alert('Error', 'Failed to delete meeting');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatus = () => {
    if (meeting?.isCompleted) return 'Over';
    if (meeting?.isCancelled) return 'Cancelled';
    return 'Upcoming';
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
              <Text style={styles.loadingText}>Loading meeting details...</Text>
            </View>
          ) : meeting ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.title} numberOfLines={2}>
                    {meeting.name}
                  </Text>
                  <Text style={styles.organizer}>
                    Organized by {meeting.createdBy?.fullName || 'Unknown'}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Meeting Details */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{meeting.type}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(meeting.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{formatTime(meeting.time)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{meeting.duration} mins</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>{getStatus()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{meeting.description}</Text>
                </View>

                {/* Participants */}
                <View style={styles.participantsSection}>
                  <Text style={styles.participantsTitle}>Participants</Text>
                  {meeting.participants && meeting.participants.length > 0 ? (
                    meeting.participants.map((participant: any, index: number) => {
                      // Handle both object and ID string formats
                      const participantName = 
                        typeof participant === 'string' 
                          ? participant 
                          : (participant.fullName || participant.name || 'Unknown');
                      
                      const participantId = typeof participant === 'string' 
                        ? participant 
                        : (participant._id || participant.id || index.toString());
                      
                      return (
                        <View key={participantId || index} style={styles.participantItem}>
                          <Ionicons name="person-circle-outline" size={16} color="#f97316" style={styles.participantIcon} />
                          <Text style={styles.participantName}>{participantName}</Text>
                          {participant.email && (
                            <Text style={styles.participantEmail}>{participant.email}</Text>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.noParticipantsContainer}>
                      <Ionicons name="people-outline" size={20} color="#9ca3af" />
                      <Text style={styles.noParticipants}>No participants added</Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#fff" style={styles.deleteButtonIcon} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    onClose();
                    onEdit?.(meeting._id);
                  }}
                  disabled={actionLoading}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
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
              <Text style={styles.errorText}>Failed to load meeting details</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadMeeting}>
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
  organizer: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  participantsSection: {
    marginTop: 8,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  participantIcon: {
    marginRight: 8,
  },
  participantName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  participantEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  noParticipantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  noParticipants: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  deleteButtonIcon: {
    marginRight: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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


