import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message } from '../types/chattypes';
import { addReaction, removeReaction, pinMessage, unpinMessage, deleteMessage } from '../Services/api';
import { useSocket } from '../Context/SocketContext';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

interface MessageMenuProps {
  message: Message;
  isCurrentUser: boolean;
  onClose: () => void;
  position: 'left' | 'right';
  alignment: 'top' | 'bottom';
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const MessageMenu: React.FC<MessageMenuProps> = ({
  message,
  isCurrentUser,
  onClose,
  position,
  alignment,
  onReply,
  onEdit,
  isModalOpen,
  setIsModalOpen,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [replyContent, setReplyContent] = useState('');
  const menuRef = useRef<View>(null);
  const editInputRef = useRef<TextInput>(null);
  const replyInputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Focus input after modal opens (with delay to prevent keyboard interference)
  useEffect(() => {
    if (isEditModalOpen) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 500);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    if (isReplyModalOpen) {
      setTimeout(() => {
        replyInputRef.current?.focus();
      }, 500);
    }
  }, [isReplyModalOpen]);

  // Prevent modal from closing due to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Don't close modal when keyboard shows
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Don't close modal when keyboard hides
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);
  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if message can be edited (within 1 hour)
  const canEditMessage = () => {
    const messageTime = new Date(message.createdAt);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - messageTime.getTime();
    const oneHourInMs = 60 * 60 * 1000;
    return timeDifference <= oneHourInMs;
  };

  const handleAction = async (action: string) => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    if (action === 'delete') {
      try {
        setLoadingAction('delete');
        await deleteMessage(message._id, token);
        
        // Emit socket event
        socket?.emit('DELETE_MESSAGE', {
          messageId: message._id,
          chatId: message.chat
        });
        
        Alert.alert('Success', 'Message deleted successfully');
        onClose();
      } catch (error) {
        console.error('Error while deleting message:', error);
        Alert.alert('Error', 'Failed to delete message');
      } finally {
        setLoadingAction(null);
      }
    } else if (action === 'edit') {
      if (!canEditMessage()) {
        Alert.alert('Error', 'Message can only be edited within 1 hour of sending');
        onClose();
        return;
      }
      // Don't call onClose() here - just open modal
      setIsEditModalOpen(true);
      setIsModalOpen(true);
    } else if (action === 'reply') {
      // Don't call onClose() here - just open modal
      setIsReplyModalOpen(true);
      setIsModalOpen(true);
    } else if (action === 'pin') {
      try {
        setLoadingAction('pin');
        await pinMessage(message._id, token);
        
        // Emit socket event
        socket?.emit('PIN_MESSAGE', {
          messageId: message._id,
          chatId: message.chat
        });
        
        Alert.alert('Success', 'Message pinned');
        onClose();
      } catch (error) {
        console.error('Error while pinning message:', error);
        Alert.alert('Error', 'Failed to pin message');
      } finally {
        setLoadingAction(null);
      }
    } else if (action === 'unpin') {
      try {
        setLoadingAction('unpin');
        await unpinMessage(message._id, token);
        
        // Emit socket event
        socket?.emit('UNPIN_MESSAGE', {
          messageId: message._id,
          chatId: message.chat
        });
        
        Alert.alert('Success', 'Message unpinned');
        onClose();
      } catch (error) {
        console.error('Error while unpinning message:', error);
        Alert.alert('Error', 'Failed to unpin message');
      } finally {
        setLoadingAction(null);
      }
    } else {
      console.log(`${action} message ${message._id}`);
      onClose();
    }
  };

  const handleEditSubmit = async () => {
    if (!editedContent.trim()) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    if (editedContent === message.content) {
      setIsEditModalOpen(false);
      onClose();
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setLoadingAction('edit');
      
      // Emit socket event for real-time update
      socket?.emit('UPDATE_MESSAGE', {
        messageId: message.messageId || message._id,
        chatId: message.chat,
        content: editedContent.trim()
      });
      
      Alert.alert('Success', 'Message updated successfully');
      setIsEditModalOpen(false);
      setIsModalOpen(false);
      onClose();
    } catch (error) {
      console.error('Error while editing message:', error);
      Alert.alert('Error', 'Failed to edit message');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      Alert.alert('Error', 'Reply cannot be empty');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setLoadingAction('reply');
      
      // Send reply through socket
      socket?.emit('REPLY_TO_MESSAGE', {
        messageId: message.messageId || message._id,
        chatId: message.chat,
        content: replyContent.trim(),
        replyTo: message._id
      });
      
      if (onReply) {
        onReply(message);
      }

      Alert.alert('Success', 'Reply sent successfully');
      setIsReplyModalOpen(false);
      setIsModalOpen(false);
      onClose();
    } catch (error) {
      console.error('Error while sending reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setLoadingAction(null);
    }
  };

  // Focus input when edit/reply modal opens
  useEffect(() => {
    if (isEditModalOpen && editInputRef.current) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 100);
    }

    if (isReplyModalOpen && replyInputRef.current) {
      setTimeout(() => {
        replyInputRef.current?.focus();
      }, 100);
    }
  }, [isEditModalOpen, isReplyModalOpen]);

  const menuItems = [
    { 
      icon: 'arrow-undo-outline', 
      label: 'Reply', 
      action: 'reply',
      color: '#FF6B35'
    },
    { 
      icon: message.pinned || message.isPinned ? 'pin' : 'pin-outline', 
      label: message.pinned || message.isPinned ? 'Unpin' : 'Pin', 
      action: message.pinned || message.isPinned ? 'unpin' : 'pin',
      color: '#FF6B35'
    },
    ...(isCurrentUser
      ? [
          {
            icon: canEditMessage() ? 'create-outline' : 'create-outline',
            label: canEditMessage() ? 'Edit' : 'Edit (expired)',
            action: 'edit',
            disabled: !canEditMessage(),
            color: canEditMessage() ? '#FF6B35' : '#9CA3AF'
          },
          {
            icon: 'trash-outline',
            label: 'Delete',
            action: 'delete',
            destructive: true,
            color: '#EF4444'
          },
        ]
      : []),
  ];

  return (
    <>
      <Animated.View
        ref={menuRef}
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
          position === 'right' ? styles.rightPosition : styles.leftPosition,
          alignment === 'bottom' ? styles.bottomAlignment : styles.topAlignment,
        ]}
      >
        <View style={styles.menuContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.action}
              style={[
                styles.menuItem,
                item.disabled && styles.disabledMenuItem,
                loadingAction === item.action && styles.loadingMenuItem,
              ]}
              onPress={() => !item.disabled && handleAction(item.action)}
              disabled={item.disabled || loadingAction === item.action}
              activeOpacity={0.7}
            >
              {loadingAction === item.action ? (
                <Ionicons name="hourglass-outline" size={16} color="#FF6B35" />
              ) : (
                <Ionicons 
                  name={item.icon as any} 
                  size={16} 
                  color={item.disabled ? '#9CA3AF' : item.color} 
                />
              )}
              <Text style={[
                styles.menuItemText,
                item.disabled && styles.disabledMenuItemText,
                item.destructive && styles.destructiveMenuItemText,
              ]}>
                {loadingAction === item.action
                  ? item.action === 'delete'
                    ? 'Deleting...'
                    : 'Processing...'
                  : item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Arrow indicator */}
        <View style={[
          styles.arrow,
          position === 'right' ? styles.rightArrow : styles.leftArrow,
          alignment === 'bottom' ? styles.bottomArrow : styles.topArrow,
        ]} />
      </Animated.View>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsEditModalOpen(false);
          setIsModalOpen(false);
          onClose();
        }}
        presentationStyle="overFullScreen"
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Message</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsEditModalOpen(false);
                  setIsModalOpen(false);
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
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
                onPress={() => {
                  setIsEditModalOpen(false);
                  setIsModalOpen(false);
                  onClose();
                }}
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
                  <Ionicons name="hourglass-outline" size={16} color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.submitButtonText}>
                  {loadingAction === 'edit' ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reply Modal */}
      <Modal
        visible={isReplyModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsReplyModalOpen(false);
          setIsModalOpen(false);
          onClose();
        }}
        presentationStyle="overFullScreen"
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Message</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsReplyModalOpen(false);
                  setIsModalOpen(false);
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.replyPreview}>
              <Text style={styles.replyPreviewLabel}>Replying to:</Text>
              <Text style={styles.replyPreviewText}>{message.content}</Text>
            </View>

            <TextInput
              ref={replyInputRef}
              value={replyContent}
              onChangeText={setReplyContent}
              style={styles.editInput}
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
                onPress={() => {
                  setIsReplyModalOpen(false);
                  setIsModalOpen(false);
                  onClose();
                }}
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
                <Ionicons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {loadingAction === 'reply' ? 'Sending...' : 'Send Reply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 9999,
    zIndex: 9999,
    minWidth: 180,
  },
  menuContent: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  loadingMenuItem: {
    opacity: 0.7,
  },
  menuItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  disabledMenuItemText: {
    color: '#9CA3AF',
  },
  destructiveMenuItemText: {
    color: '#EF4444',
  },
  leftPosition: {
    left: 0,
  },
  rightPosition: {
    right: 0,
  },
  topAlignment: {
    bottom: 60,
  },
  bottomAlignment: {
    top: 60,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  topArrow: {
    top: '100%',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  bottomArrow: {
    bottom: '100%',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
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
    color: '#1F2937',
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
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 100,
  },
  replyPreview: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  replyPreviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  replyPreviewText: {
    fontSize: 14,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
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
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
});

export default MessageMenu;
