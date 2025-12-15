import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '../types/chattypes';
import { useSocket } from '../hooks/socket';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { pinMessage, deleteMessage } from '../Services/api';

interface MessageMenuProps {
  message: Message;
  isCurrentUser: boolean;
  onClose: () => void;
  position: 'left' | 'right';
  alignment: 'top' | 'bottom';
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

const MessageMenu: React.FC<MessageMenuProps> = ({
  message,
  isCurrentUser,
  onClose,
  position,
  alignment,
  onReply,
  onEdit,
  onForward,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [replyContent, setReplyContent] = useState('');
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const editInputRef = useRef<TextInput>(null);
  const replyInputRef = useRef<TextInput>(null);
  const isModalOpenRef = useRef(false);

  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);

  // Stable modal state management
  const isAnyModalOpen = isEditModalOpen || isReplyModalOpen;

  useEffect(() => {
    // Animate in
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  // Handle modal state changes
  useEffect(() => {
    // Removed verbose logging - only track state internally
    isModalOpenRef.current = isAnyModalOpen;
  }, [isAnyModalOpen, isEditModalOpen, isReplyModalOpen]);

  // Handle back button on Android
  useEffect(() => {
    if (isAnyModalOpen) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleCloseModal();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [isAnyModalOpen]);

  // Focus input after modal opens with aggressive modal protection
  useEffect(() => {
    if (isEditModalOpen && editInputRef.current) {
      // Keep modal open while focusing
      const keepModalOpen = setInterval(() => {
        if (isEditModalOpen) {
          setIsEditModalOpen(true);
        }
      }, 100);

      const focusTimer = setTimeout(() => {
        if (editInputRef.current && isEditModalOpen) {
          editInputRef.current.focus();
        }
      }, 300);

      return () => {
        clearTimeout(focusTimer);
        clearInterval(keepModalOpen);
      };
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    if (isReplyModalOpen && replyInputRef.current) {
      // Keep modal open while focusing
      const keepModalOpen = setInterval(() => {
        if (isReplyModalOpen) {
          setIsReplyModalOpen(true);
        }
      }, 100);

      const focusTimer = setTimeout(() => {
        if (replyInputRef.current && isReplyModalOpen) {
          replyInputRef.current.focus();
        }
      }, 300);

      return () => {
        clearTimeout(focusTimer);
        clearInterval(keepModalOpen);
      };
    }
  }, [isReplyModalOpen]);

  // Stable modal close handler
  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false);
    setIsReplyModalOpen(false);
    setEditedContent(message.content || '');
    setReplyContent('');
  }, [message.content]);

  const handleAction = async (action: string) => {
    if (loadingAction) return;

    try {
      if (action === 'edit') {
        console.log('Opening edit modal...');
        // Force modal to stay open by setting state multiple times
        setIsEditModalOpen(true);
        setTimeout(() => {
          console.log('Setting edit modal true again...');
          setIsEditModalOpen(true);
        }, 100);
        setTimeout(() => {
          console.log('Setting edit modal true again...');
          setIsEditModalOpen(true);
        }, 200);
      } else if (action === 'reply') {
        console.log('Opening reply modal...');
        // Force modal to stay open by setting state multiple times
        setIsReplyModalOpen(true);
        setTimeout(() => {
          console.log('Setting reply modal true again...');
          setIsReplyModalOpen(true);
        }, 100);
        setTimeout(() => {
          console.log('Setting reply modal true again...');
          setIsReplyModalOpen(true);
        }, 200);
      } else if (action === 'pin') {
        setLoadingAction('pin');
        await pinMessage(message._id, token || '');
        
        socket?.emit('PIN_MESSAGE', {
          messageId: message._id,
          chatId: message.chat
        });
        
        Alert.alert('Success', 'Message pinned');
        onClose();
      } else if (action === 'delete') {
        setLoadingAction('delete');
        await deleteMessage(message._id, token || '');
        
        socket?.emit('DELETE_MESSAGE', {
          messageId: message._id,
          chatId: message.chat
        });
        
        Alert.alert('Success', 'Message deleted');
        onClose();
      }
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      Alert.alert('Error', `Failed to ${action} message`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!editedContent.trim() || loadingAction === 'edit') return;

    try {
      setLoadingAction('edit');
      
      socket?.emit('UPDATE_MESSAGE', {
        messageId: message.messageId || message._id,
        chatId: message.chat,
        content: editedContent.trim()
      });
      
      Alert.alert('Success', 'Message updated successfully');
      handleCloseModal();
      onClose();
    } catch (error) {
      console.error('Error while editing message:', error);
      Alert.alert('Error', 'Failed to edit message');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || loadingAction === 'reply') return;

    try {
      setLoadingAction('reply');
      
      socket?.emit('REPLY_TO_MESSAGE', {
        originalMessageId: message._id,
        chatId: message.chat,
        content: replyContent.trim()
      });
      
      if (onReply) {
        onReply(message);
      }

      Alert.alert('Success', 'Reply sent successfully');
      handleCloseModal();
      onClose();
    } catch (error) {
      console.error('Error while sending reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setLoadingAction(null);
    }
  };

  const calculateMenuPosition = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 9999,
      elevation: 9999,
    };

    if (alignment === 'top') {
      return {
        ...baseStyle,
        bottom: 60,
        ...(position === 'right' ? { right: 0 } : { left: 0 }),
      };
    } else {
      return {
        ...baseStyle,
        top: 60,
        ...(position === 'right' ? { right: 0 } : { left: 0 }),
      };
    }
  };

  return (
    <>
      {/* Menu */}
      <Animated.View style={[styles.container, calculateMenuPosition(), { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleAction('reply')}
          disabled={loadingAction === 'reply'}
        >
          <Icon name="arrow-undo" size={20} color="#6B7280" />
          <Text style={styles.menuText}>Reply</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleAction('pin')}
          disabled={loadingAction === 'pin'}
        >
          <Icon name="pin" size={20} color="#6B7280" />
          <Text style={styles.menuText}>Pin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            console.log('🔍 [MessageMenu] Forward button pressed');
            console.log('🔍 [MessageMenu] onForward exists:', !!onForward);
            if (onForward) {
              console.log('🔍 [MessageMenu] Calling onForward with message:', message._id);
              onForward(message);
            } else {
              console.error('🔍 [MessageMenu] onForward is not defined!');
            }
            onClose();
          }}
        >
          <Icon name="arrow-forward" size={20} color="#6B7280" />
          <Text style={styles.menuText}>Forward</Text>
        </TouchableOpacity>

        {isCurrentUser && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleAction('edit')}
            disabled={loadingAction === 'edit'}
          >
            <Icon name="create" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity>
        )}

        {isCurrentUser && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleAction('delete')}
            disabled={loadingAction === 'delete'}
          >
            <Icon name="trash" size={20} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Edit Modal */}
        <Modal
          visible={isEditModalOpen}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseModal}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          hardwareAccelerated={true}
        >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {}} // Prevent closing on overlay tap
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent event bubbling
          >
            <KeyboardAvoidingView 
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Message</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                ref={editInputRef}
                value={editedContent}
                onChangeText={setEditedContent}
                style={styles.editInput}
                multiline
                numberOfLines={4}
                placeholder="Edit your message..."
                editable={loadingAction !== 'edit'}
                textAlignVertical="top"
                autoFocus={false}
                blurOnSubmit={false}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={loadingAction === 'edit'}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditSubmit}
                  style={[styles.modalButton, styles.submitButton]}
                  disabled={loadingAction === 'edit' || !editedContent.trim()}
                >
                  {loadingAction === 'edit' ? (
                    <Icon name="hourglass-outline" size={16} color="#FFFFFF" />
                  ) : (
                    <Icon name="checkmark" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {loadingAction === 'edit' ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reply Modal */}
        <Modal
          visible={isReplyModalOpen}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseModal}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          hardwareAccelerated={true}
        >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {}} // Prevent closing on overlay tap
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent event bubbling
          >
            <KeyboardAvoidingView 
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reply to Message</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.replyPreview}>
                <Text style={styles.replyPreviewText}>
                  {message.content?.substring(0, 100)}
                  {message.content && message.content.length > 100 ? '...' : ''}
                </Text>
              </View>

              <TextInput
                ref={replyInputRef}
                value={replyContent}
                onChangeText={setReplyContent}
                style={styles.replyInput}
                multiline
                numberOfLines={4}
                placeholder="Type your reply..."
                editable={loadingAction !== 'reply'}
                textAlignVertical="top"
                autoFocus={false}
                blurOnSubmit={false}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={loadingAction === 'reply'}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReplySubmit}
                  style={[styles.modalButton, styles.submitButton]}
                  disabled={loadingAction === 'reply' || !replyContent.trim()}
                >
                  {loadingAction === 'reply' ? (
                    <Icon name="hourglass-outline" size={16} color="#FFFFFF" />
                  ) : (
                    <Icon name="send" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {loadingAction === 'reply' ? 'Sending...' : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    marginBottom: 16,
  },
  replyPreview: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  replyPreviewText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default MessageMenu;