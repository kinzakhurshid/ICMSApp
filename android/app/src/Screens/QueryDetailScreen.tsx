import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { OrgQuery } from '../types/queries';

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  Noted: { bg: '#FEE2E2', text: '#B91C1C' },
  Solved: { bg: '#DCFCE7', text: '#166534' },
};

const QueryDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { callApi } = useAxios();
  const { queryId, query: initialQuery } = route.params || {};

  const [query, setQuery] = useState<OrgQuery | null>(initialQuery || null);
  const [loading, setLoading] = useState(!initialQuery);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const hasAutoUpdatedStatus = useRef(false);

  const fetchQueryDetails = useCallback(async () => {
    if (!queryId) return;
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/query/${queryId}`,
      });
      setQuery(response.data || response);
    } catch (error: any) {
      console.error('Error fetching query details:', error);
      Alert.alert('Error', 'Failed to load query details');
    } finally {
      setLoading(false);
    }
  }, [queryId, callApi]);

  useFocusEffect(
    useCallback(() => {
      if (!initialQuery) {
        fetchQueryDetails();
      } else {
        setQuery(initialQuery);
      }
      hasAutoUpdatedStatus.current = false; // Reset on focus
    }, [fetchQueryDetails, initialQuery])
  );

  // Auto-update status to "Noted" when viewing a "Pending" query (only once per query load)
  useEffect(() => {
    if (query && query.status === 'Pending' && queryId && !hasAutoUpdatedStatus.current) {
      hasAutoUpdatedStatus.current = true;
      // Auto-update to "Noted" as per API documentation
      updateQueryStatus('Noted');
    }
  }, [query?._id, query?.status]);

  const updateQueryStatus = async (newStatus: string) => {
    if (!queryId) return;
    try {
      setUpdatingStatus(true);
      // Use PATCH method as per API documentation
      await callApi({
        method: 'PATCH',
        url: `/query/${queryId}/status`,
        data: { status: newStatus },
      });
      Alert.alert('Success', 'Query status updated successfully');
      // Refresh query details
      if (initialQuery) {
        setQuery(prev => prev ? { ...prev, status: newStatus as any } : null);
      } else {
        fetchQueryDetails();
      }
    } catch (error: any) {
      console.error('Update query status error:', error);
      const errorMessage = error?.message || 
                           (typeof error === 'string' ? error : 'Failed to update query status');
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addComment = async () => {
    if (!queryId || !comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (query?.status === 'Solved') {
      Alert.alert('Error', 'Cannot add comments to solved queries');
      return;
    }

    try {
      setSubmittingComment(true);
      
      // Use 'text' field as per API documentation: POST /query/${id}/comment with { text: string }
      await callApi({
        method: 'POST',
        url: `/query/${queryId}/comment`,
        data: { text: comment.trim() },
      });
      
      Alert.alert('Success', 'Comment added successfully');
      setComment('');
      fetchQueryDetails();
    } catch (error: any) {
      console.error('[QueryDetail] Add comment error:', error);
      const errorMessage = error?.message || 
                           (typeof error === 'string' ? error : 'Failed to add comment');
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return value;
    }
  };

  const statusBadge = (status?: string) => {
    if (!status) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#E5E7EB' }]}>
          <Text style={[styles.statusText, { color: '#374151' }]}>Unknown</Text>
        </View>
      );
    }

    const stylesForStatus = statusColors[status] || { bg: '#E5E7EB', text: '#374151' };
    return (
      <View style={[styles.statusBadge, { backgroundColor: stylesForStatus.bg }]}>
        <Text style={[styles.statusText, { color: stylesForStatus.text }]}>{status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
        <Text style={styles.loadingText}>Loading query details...</Text>
      </View>
    );
  }

  if (!query) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Query not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const employeeName = query.employeeId?.fullName ||
    [query.employeeId?.firstName, query.employeeId?.lastName].filter(Boolean).join(' ') ||
    'N/A';

  const isSolved = query.status === 'Solved';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with Mark as Solved button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Query Management</Text>
        {!isSolved && (
          <TouchableOpacity
            style={styles.solveButton}
            onPress={() => updateQueryStatus('Solved')}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.solveButtonText}>Mark as Solved</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Query Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.queryId}>{query.subject || query._id || 'N/A'}</Text>
        {query.description && (
          <Text style={styles.queryDescription}>{query.description}</Text>
        )}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status:</Text>
            {statusBadge(query.status)}
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Created On:</Text>
            <Text style={styles.detailValue}>{formatDate(query.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Employee:</Text>
            <Text style={styles.detailValue}>{employeeName}</Text>
          </View>
          {query.employeeId?.position && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Designation:</Text>
              <Text style={styles.detailValue}>{query.employeeId.position}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Update Section */}
      {!isSolved && (
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            {['Pending', 'In Progress', 'Noted'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  query.status === status && styles.statusButtonActive,
                ]}
                onPress={() => updateQueryStatus(status)}
                disabled={updatingStatus || query.status === status}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    query.status === status && styles.statusButtonTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Comments Section */}
      <View style={styles.commentsCard}>
        <Text style={styles.sectionTitle}>Comments</Text>
        <View style={styles.divider} />
        
        {query.comments && query.comments.length > 0 ? (
          <View style={styles.commentsList}>
            {query.comments.map((comment: any, index: number) => (
              <View key={index} style={styles.commentItem}>
                <Text style={styles.commentText}>{comment.comment || comment}</Text>
                {comment.createdAt && (
                  <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noCommentsText}>
            {isSolved ? 'No comments yet.' : 'No comments yet.'}
          </Text>
        )}

        {isSolved && (
          <Text style={styles.disabledText}>
            This query has been marked as solved. Comments are disabled.
          </Text>
        )}

        {!isSolved && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              editable={!submittingComment}
            />
            <TouchableOpacity
              style={[styles.sendButton, submittingComment && styles.sendButtonDisabled]}
              onPress={addComment}
              disabled={submittingComment || !comment.trim()}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FB923C',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  solveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  solveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  queryId: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  queryDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#FB923C',
    borderColor: '#FB923C',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  commentsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  disabledText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default QueryDetailScreen;

