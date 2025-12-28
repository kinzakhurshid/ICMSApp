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
  Linking,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { OrgQuery } from '../types/queries';

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Noted: { bg: '#FEE2E2', text: '#B91C1C' },
  Solved: { bg: '#DCFCE7', text: '#166534' },
};

const QueryDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { callApi } = useAxios();
  const { queryId, query: initialQuery, redirectTo } = (route.params as any) || {};

  const [query, setQuery] = useState<OrgQuery | null>(initialQuery || null);
  const [loading, setLoading] = useState(!initialQuery);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const hasAutoUpdatedStatus = useRef(false);
  const justAddedComment = useRef(false);
  const commentAddedTime = useRef<number | null>(null);

  const fetchQueryDetails = useCallback(async () => {
    if (!queryId) return;
    
    // Don't refresh if we just added a comment (within last 3 seconds)
    const timeSinceComment = commentAddedTime.current ? Date.now() - commentAddedTime.current : Infinity;
    if (justAddedComment.current && timeSinceComment < 3000) {
      console.log('⏸️ Skipping fetchQueryDetails - comment just added', timeSinceComment, 'ms ago');
      return;
    }
    
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/query/${queryId}`,
      });
      const queryData = response.data || response;
      // Ensure all fields are properly initialized to prevent crashes
      if (queryData) {
        // Debug: Log media files data
        console.log('📎 Query media files:', {
          mediaFiles: queryData.mediaFiles,
          attachments: queryData.attachments,
          mediaFilesCount: queryData.mediaFiles?.length || 0,
          attachmentsCount: queryData.attachments?.length || 0,
        });
        
        setQuery((prevQuery) => {
          // Merge with previous query to preserve any optimistic updates
          const combinedMediaFiles = queryData.mediaFiles || queryData.attachments || [];
          return {
            ...queryData,
            comments: queryData.comments || [],
            mediaFiles: combinedMediaFiles,
            attachments: queryData.attachments || queryData.mediaFiles || [],
            status: queryData.status || 'Pending',
          };
        });
      }
    } catch (error: any) {
      console.error('Error fetching query details:', error);
      Alert.alert('Error', 'Failed to load query details');
    } finally {
      setLoading(false);
    }
  }, [queryId, callApi]);

  useFocusEffect(
    useCallback(() => {
      // Don't refresh if we just added a comment (within last 3 seconds)
      const timeSinceComment = commentAddedTime.current ? Date.now() - commentAddedTime.current : Infinity;
      if (justAddedComment.current && timeSinceComment < 3000) {
        console.log('⏸️ useFocusEffect: Skipping refresh - comment just added', timeSinceComment, 'ms ago');
        return;
      }
      
      if (!initialQuery) {
        fetchQueryDetails();
      } else {
        // Only set initialQuery if we don't already have query data (to avoid overwriting optimistic updates)
        setQuery((prevQuery) => {
          if (!prevQuery && initialQuery) {
            return {
              ...initialQuery,
              mediaFiles: initialQuery.mediaFiles || initialQuery.attachments || [],
              comments: initialQuery.comments || [],
            };
          }
          // If we already have query data, don't overwrite it
          return prevQuery;
        });
      }
      hasAutoUpdatedStatus.current = false; // Reset on focus
    }, [fetchQueryDetails, initialQuery])
  );

  // Auto-update status to "Noted" when viewing a "Pending" query (only once per query load)
  // But only if user hasn't manually changed it
  useEffect(() => {
    // Only auto-update if:
    // 1. Query exists and status is Pending
    // 2. We haven't already auto-updated this query
    // 3. We're not currently updating status
    // 4. This is the initial load (not a refresh after manual update)
    if (query && 
        query.status === 'Pending' && 
        queryId && 
        !hasAutoUpdatedStatus.current && 
        !updatingStatus &&
        query._id) {
      hasAutoUpdatedStatus.current = true;
      // Auto-update to "Noted" as per API documentation
      updateQueryStatus('Noted').catch(() => {
        // If auto-update fails, reset the flag so user can try manually
        hasAutoUpdatedStatus.current = false;
      });
    }
  }, [query?._id]); // Only depend on query._id, not status, to prevent loops

  const updateQueryStatus = async (newStatus: string) => {
    if (!queryId) return;
    
    // Validate status value (only Pending, Noted, Solved are allowed)
    const validStatuses = ['Pending', 'Noted', 'Solved'];
    if (!validStatuses.includes(newStatus)) {
      Alert.alert('Error', `Invalid status. Allowed values: ${validStatuses.join(', ')}`);
      return;
    }
    
    try {
      setUpdatingStatus(true);
      
      // Use PATCH method as per API documentation
      await callApi({
        method: 'PATCH',
        url: `/query/${queryId}/status`,
        data: { status: newStatus },
      });
      
      // Immediately update local state for instant UI update
      setQuery((prevQuery) => {
        if (!prevQuery) return prevQuery;
        return {
          ...prevQuery,
          status: newStatus as any,
        };
      });
      
      // Refresh query details in background without showing loading
      const refreshQuery = async () => {
        try {
          const response = await callApi({
            method: 'GET',
            url: `/query/${queryId}`,
          });
          const queryData = response.data || response;
          if (queryData) {
            setQuery({
              ...queryData,
              comments: queryData.comments || [],
              mediaFiles: queryData.mediaFiles || queryData.attachments || [],
              status: queryData.status || 'Pending',
            });
          }
        } catch (error) {
          console.error('Background refresh failed:', error);
        }
      };
      
      // Refresh in background
      refreshQuery();
      
      Alert.alert('Success', 'Query status updated successfully');
    } catch (error: any) {
      console.error('Update query status error:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error ||
                           error?.message || 
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
      
      const commentText = comment.trim();
      
      // Clear input first
      const commentToAdd = comment.trim();
      setComment('');
      
      // Mark that we're adding a comment to prevent refreshes
      justAddedComment.current = true;
      commentAddedTime.current = Date.now();
      
      // Optimistically add comment to local state for instant UI update
      const tempComment = {
        text: commentToAdd,
        comment: commentToAdd,
        createdAt: new Date().toISOString(),
      };
      
      // Update state immediately - this should trigger re-render
      setQuery((prevQuery) => {
        if (!prevQuery) return prevQuery;
        const prevComments = prevQuery.comments || [];
        const newComments = [...prevComments, tempComment];
        console.log('✅ Optimistic comment added. Previous count:', prevComments.length, 'New count:', newComments.length);
        console.log('✅ New comment text:', tempComment.text || tempComment.comment);
        
        // Create completely new object to ensure React detects the change
        return {
          ...prevQuery,
          comments: newComments,
        };
      });
      
      // Use 'text' field as per API documentation: POST /query/:id/comment with body { text: string }
      await callApi({
        method: 'POST',
        url: `/query/${queryId}/comment`,
        data: { text: commentToAdd },
      });
      
      // Refresh after delay to get server data with proper metadata
      // But keep optimistic comment visible until server confirms it
      setTimeout(async () => {
        try {
          // Wait a bit more to ensure server has saved
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const refreshResponse = await callApi({
            method: 'GET',
            url: `/query/${queryId}`,
          });
          const queryData = refreshResponse.data || refreshResponse;
          if (queryData) {
            setQuery((prevQuery) => {
              if (!prevQuery) return prevQuery;
              
              const serverComments = queryData.comments || [];
              console.log('🔄 Background refresh - Server comments count:', serverComments.length);
              console.log('🔄 Background refresh - Looking for comment:', commentToAdd);
              
              // Check if server has our new comment
              const serverHasOurComment = serverComments.some(
                (c: any) => {
                  const cText = c.text || c.comment || '';
                  return cText === commentToAdd;
                }
              );
              
              console.log('🔄 Server has our comment:', serverHasOurComment);
              
              // If server has it, use server comments; otherwise keep optimistic + server comments
              let finalComments = serverComments;
              if (!serverHasOurComment) {
                // Server doesn't have it yet, keep our optimistic comment
                const optimisticComment = prevQuery.comments?.find(
                  (c: any) => (c.text || c.comment || '') === commentToAdd
                );
                if (optimisticComment) {
                  console.log('✅ Keeping optimistic comment, server doesn\'t have it yet');
                  finalComments = [...serverComments, optimisticComment];
                }
              } else {
                console.log('✅ Server has comment, using server data');
              }
              
              return {
                ...queryData,
                comments: finalComments,
                mediaFiles: queryData.mediaFiles || queryData.attachments || prevQuery.mediaFiles || [],
                status: queryData.status || prevQuery.status || 'Pending',
              };
            });
          }
          // Reset flag after refresh completes
          justAddedComment.current = false;
          commentAddedTime.current = null;
          console.log('🔄 Background refresh complete, flag reset');
        } catch (error) {
          console.error('Background refresh failed:', error);
          // Reset flag even on error, but after a delay
          setTimeout(() => {
            justAddedComment.current = false;
            commentAddedTime.current = null;
          }, 1000);
        }
      }, 3000); // Wait 3 seconds for server to fully process and save
      
      Alert.alert('Success', 'Comment added successfully');
    } catch (error: any) {
      console.error('[QueryDetail] Add comment error:', error);
      
      // If API call failed, remove the optimistically added comment
      setQuery((prevQuery) => {
        if (!prevQuery) return prevQuery;
        return {
          ...prevQuery,
          comments: prevQuery.comments?.slice(0, -1) || [],
        };
      });
      
      // Restore the comment text so user can try again
      setComment(commentText);
      
      const errorMessage = error?.response?.data?.message ||
                           error?.response?.data?.error ||
                           error?.message || 
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (redirectTo) {
              (navigation as any).navigate(redirectTo);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const employeeName = query?.employeeId?.fullName ||
    [query?.employeeId?.firstName, query?.employeeId?.lastName].filter(Boolean).join(' ') ||
    'N/A';

  const isSolved = query.status === 'Solved';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with Mark as Solved button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (redirectTo) {
              (navigation as any).navigate(redirectTo);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backIcon}
        >
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
          <Text style={styles.statusInfo}>
            Current: {query.status || 'Pending'}
          </Text>
          <View style={styles.statusButtons}>
            {['Pending', 'Noted', 'Solved'].map((status) => (
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

      {/* Media Files Section */}
      {(() => {
        // Combine mediaFiles and attachments arrays
        const allMediaFiles = [
          ...(query.mediaFiles || []),
          ...(query.attachments || [])
        ];
        
        // Remove duplicates based on URL or _id
        const uniqueMediaFiles = allMediaFiles.filter((file, index, self) => 
          index === self.findIndex((f) => 
            (f._id && f._id === file._id) || 
            (f.url && f.url === file.url) ||
            (!f._id && !f.url && index === self.findIndex(ff => !ff._id && !ff.url))
          )
        );
        
        if (uniqueMediaFiles.length === 0) return null;
        
        const getFileIcon = (file: any) => {
          const fileName = (file.name || file.url || '').toLowerCase();
          const fileType = file.type || '';
          
          if (fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || fileType.startsWith('image/')) {
            return 'image';
          } else if (fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i) || fileType.startsWith('video/')) {
            return 'videocam';
          } else if (fileName.match(/\.(pdf)$/i) || fileType.includes('pdf')) {
            return 'picture-as-pdf';
          } else if (fileName.match(/\.(doc|docx)$/i) || fileType.includes('word')) {
            return 'description';
          } else if (fileName.match(/\.(xls|xlsx)$/i) || fileType.includes('excel') || fileType.includes('spreadsheet')) {
            return 'table-chart';
          } else {
            return 'attach-file';
          }
        };
        
        const getFileTypeName = (file: any) => {
          const fileName = (file.name || file.url || '').toLowerCase();
          if (fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) return 'Image';
          if (fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) return 'Video';
          if (fileName.match(/\.(pdf)$/i)) return 'PDF';
          if (fileName.match(/\.(doc|docx)$/i)) return 'Word';
          if (fileName.match(/\.(xls|xlsx)$/i)) return 'Excel';
          return 'File';
        };
        
        const handleOpenFile = async (file: any) => {
          const fileUrl = file.url;
          if (!fileUrl) {
            Alert.alert('Error', 'File URL not available');
            return;
          }
          
          try {
            // Check if URL is valid
            const canOpen = await Linking.canOpenURL(fileUrl);
            if (canOpen) {
              await Linking.openURL(fileUrl);
            } else {
              Alert.alert(
                'Cannot Open File',
                'This file type cannot be opened directly. You may need to download it first.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Copy URL',
                    onPress: () => {
                      // You can add clipboard functionality here if needed
                      Alert.alert('Info', `File URL: ${fileUrl}`);
                    }
                  }
                ]
              );
            }
          } catch (error: any) {
            console.error('Error opening file:', error);
            Alert.alert(
              'Error',
              `Failed to open file: ${error.message || 'Unknown error'}`
            );
          }
        };
        
        const isImageFile = (file: any) => {
          const fileName = (file.name || file.url || '').toLowerCase();
          const fileType = file.type || '';
          return fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || fileType.startsWith('image/');
        };
        
        return (
          <View style={styles.mediaCard}>
            <Text style={styles.sectionTitle}>
              Attachments ({uniqueMediaFiles.length})
            </Text>
            <View style={styles.divider} />
            <View style={styles.mediaList}>
              {uniqueMediaFiles.map((file: any, index: number) => {
                const fileUrl = file.url;
                const fileName = file.name || (fileUrl ? fileUrl.split('/').pop() : `File ${index + 1}`) || `File ${index + 1}`;
                const iconName = getFileIcon(file);
                const fileTypeName = getFileTypeName(file);
                const isImage = isImageFile(file);
                
                return (
                  <TouchableOpacity
                    key={file._id || file.url || index}
                    style={styles.mediaItem}
                    onPress={() => handleOpenFile(file)}
                    activeOpacity={0.7}
                  >
                    {isImage && fileUrl ? (
                      <Image
                        source={{ uri: fileUrl }}
                        style={styles.mediaThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.mediaIconContainer}>
                        <Icon name={iconName} size={24} color="#3B82F6" />
                      </View>
                    )}
                    <View style={styles.mediaInfo}>
                      <Text style={styles.mediaText} numberOfLines={1}>
                        {fileName}
                      </Text>
                      <Text style={styles.mediaTypeText}>{fileTypeName}</Text>
                    </View>
                    <Icon name="open-in-new" size={18} color="#6B7280" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })()}

      {/* Comments Section */}
      <View style={styles.commentsCard}>
        <Text style={styles.sectionTitle}>Comments</Text>
        <View style={styles.divider} />
        
        {(() => {
          const comments = query?.comments || [];
          const hasComments = Array.isArray(comments) && comments.length > 0;
          console.log('🔍 Rendering comments. Count:', comments.length, 'Has comments:', hasComments);
          if (hasComments) {
            console.log('🔍 Comments:', comments.map((c: any) => c.text || c.comment || ''));
          }
          
          return hasComments ? (
            <View style={styles.commentsList}>
              {comments.map((commentItem: any, index: number) => {
              // Handle different comment formats
              const commentText = commentItem.comment || commentItem.text || commentItem || '';
              const commentDate = commentItem.createdAt || commentItem.date || '';
              
              // Handle author - could be string or object
              let commentAuthor = '';
              const authorRaw = commentItem.createdBy || commentItem.author;
              if (authorRaw) {
                if (typeof authorRaw === 'string') {
                  commentAuthor = authorRaw;
                } else if (typeof authorRaw === 'object') {
                  // Extract name from object (could have name, fullName, firstName/lastName, etc.)
                  commentAuthor = authorRaw.name || 
                                  authorRaw.fullName || 
                                  [authorRaw.firstName, authorRaw.lastName].filter(Boolean).join(' ') ||
                                  authorRaw.email ||
                                  'Unknown';
                }
              }
              
              return (
                <View key={index} style={styles.commentItem}>
                  {commentAuthor && (
                    <Text style={styles.commentAuthor}>{commentAuthor}</Text>
                  )}
                  <Text style={styles.commentText}>
                    {typeof commentText === 'string' ? commentText : JSON.stringify(commentText)}
                  </Text>
                  {commentDate && (
                    <Text style={styles.commentDate}>{formatDate(commentDate)}</Text>
                  )}
                </View>
              );
            })}
          </View>
          ) : (
            <Text style={styles.noCommentsText}>No comments yet.</Text>
          );
        })()}

        {isSolved && (
          <Text style={styles.disabledText}>
            This query has been marked as solved. Comments are disabled.
          </Text>
        )}

        {/* Allow comments for all statuses except Solved */}
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
  statusInfo: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  statusNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
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
  commentAuthor: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
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
  mediaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaList: {
    gap: 8,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  mediaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  mediaInfo: {
    flex: 1,
    gap: 2,
  },
  mediaText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  mediaTypeText: {
    fontSize: 12,
    color: '#6B7280',
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

