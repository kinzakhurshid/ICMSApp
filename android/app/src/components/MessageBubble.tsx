import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message, User } from '../types/chattypes';
import { addReaction, removeReaction, pinMessage, unpinMessage, deleteMessage } from '../Services/api';
import { useSocket } from '../Context/SocketContext';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import AttachmentViewer from './AttachmentViewer';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  currentUser: User;
  onReply: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  showReactions?: boolean;
  showPinIcon?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  showReactions = true,
  showPinIcon = true,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);

  const handleReaction = async (emoji: string) => {
    if (!token || isLoading) return;
    
    setIsLoading(true);
    try {
      const existingReaction = message.reactions.find(
        r => r.user._id === currentUser._id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        await removeReaction(message._id, emoji, token);
        
        // Emit socket event for real-time update
        socket?.emit('REMOVE_REACTION', {
          messageId: message._id,
          chatId: message.chat,
          emoji,
          userId: currentUser._id
        });
      } else {
        // Add reaction
        await addReaction(message._id, emoji, token);
        
        // Emit socket event for real-time update
        socket?.emit('ADD_REACTION', {
          messageId: message._id,
          chatId: message.chat,
          emoji,
          userId: currentUser._id,
          user: currentUser
        });
      }
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    } finally {
      setIsLoading(false);
      setShowReactionPicker(false);
    }
  };

  const handlePin = async () => {
    if (!token || isLoading) return;
    
    setIsLoading(true);
    try {
      if (message.pinned || message.isPinned) {
        await unpinMessage(message._id, token);
        onUnpin?.(message._id);
      } else {
        await pinMessage(message._id, token);
        onPin?.(message._id);
      }

      // Emit socket event
      socket?.emit(message.pinned || message.isPinned ? 'UNPIN_MESSAGE' : 'PIN_MESSAGE', {
        messageId: message._id,
        chatId: message.chat
      });
    } catch (error) {
      console.error('Failed to pin/unpin message:', error);
      Alert.alert('Error', 'Failed to update pin status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteMessage(message._id, token);
              onDelete?.(message._id);
              
              // Emit socket event
              socket?.emit('DELETE_MESSAGE', {
                messageId: message._id,
                chatId: message.chat
              });
            } catch (error) {
              console.error('Failed to delete message:', error);
              
              // Check if message was already deleted
              if (error.message?.includes('Resource not found') || 
                  error.message?.includes('Message not found') ||
                  error.message?.includes('Message not found or deleted') ||
                  error.message?.includes('Failed to load resource')) {
                // Message was already deleted, remove from local state
                onDelete?.(message._id);
                console.log('Message was already deleted, removed from local state');
              } else {
                // Only show error for actual failures, not for already deleted messages
                console.log('Delete failed, but message removed from local state');
              }
            }
          }
        }
      ]
    );
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    const formatFileSize = (bytes: number): string => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string): string => {
      if (type.startsWith('image/')) return 'image-outline';
      if (type.startsWith('audio/')) return 'musical-notes-outline';
      if (type.startsWith('video/')) return 'videocam-outline';
      if (type.includes('pdf')) return 'document-text-outline';
      if (type.includes('word') || type.includes('doc')) return 'document-text-outline';
      if (type.includes('excel') || type.includes('xls')) return 'grid-outline';
      if (type.includes('powerpoint') || type.includes('ppt')) return 'easel-outline';
      return 'document-outline';
    };

    const getFileTypeColor = (type: string): string => {
      if (type.startsWith('image/')) return '#4CAF50';
      if (type.startsWith('audio/')) return '#FF9800';
      if (type.startsWith('video/')) return '#F44336';
      if (type.includes('pdf')) return '#E91E63';
      if (type.includes('word') || type.includes('doc')) return '#2196F3';
      if (type.includes('excel') || type.includes('xls')) return '#4CAF50';
      if (type.includes('powerpoint') || type.includes('ppt')) return '#FF5722';
      return '#9E9E9E';
    };

    return (
      <View style={styles.attachmentsContainer}>
        {message.attachments.map((attachment, index) => {
          const attachmentType = attachment.fileType || attachment.type || 'unknown';
          
          if (attachmentType.startsWith('image/') || attachmentType === 'image') {
            return (
              <View key={index} style={styles.imageAttachment}>
                <Image 
                  source={{ uri: attachment.url || attachment.uri }} 
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <TouchableOpacity style={styles.downloadButton}>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          } else if (attachmentType.startsWith('audio/') || attachmentType === 'audio') {
            return (
              <View key={index} style={[
                styles.fileAttachment,
                isCurrentUser ? styles.currentUserFileAttachment : styles.otherUserFileAttachment
              ]}>
                <View style={[styles.fileIconContainer, { backgroundColor: getFileTypeColor(attachmentType) }]}>
                  <Ionicons name={getFileIcon(attachmentType)} size={24} color="#fff" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[
                    styles.fileName,
                    isCurrentUser ? styles.currentUserFileName : styles.otherUserFileName
                  ]} numberOfLines={1}>
                    {attachment.originalName || 'Voice Message'}
                  </Text>
                  <Text style={[
                    styles.fileType,
                    isCurrentUser ? styles.currentUserFileType : styles.otherUserFileType
                  ]}>
                    Voice Message
                  </Text>
                  {attachment.size && (
                    <Text style={[
                      styles.fileSize,
                      isCurrentUser ? styles.currentUserFileSize : styles.otherUserFileSize
                    ]}>
                      {formatFileSize(attachment.size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.downloadButtonSmall}>
                  <Ionicons name="download-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            );
          } else {
            return (
              <View key={index} style={[
                styles.fileAttachment,
                isCurrentUser ? styles.currentUserFileAttachment : styles.otherUserFileAttachment
              ]}>
                <View style={[styles.fileIconContainer, { backgroundColor: getFileTypeColor(attachmentType) }]}>
                  <Ionicons name={getFileIcon(attachmentType)} size={24} color="#fff" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[
                    styles.fileName,
                    isCurrentUser ? styles.currentUserFileName : styles.otherUserFileName
                  ]} numberOfLines={1}>
                    {attachment.originalName || 'Document'}
                  </Text>
                  <Text style={[
                    styles.fileType,
                    isCurrentUser ? styles.currentUserFileType : styles.otherUserFileType
                  ]}>
                    {(attachmentType || 'FILE').split('/')[1]?.toUpperCase() || 'FILE'}
                  </Text>
                  {attachment.size && (
                    <Text style={[
                      styles.fileSize,
                      isCurrentUser ? styles.currentUserFileSize : styles.otherUserFileSize
                    ]}>
                      {formatFileSize(attachment.size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.downloadButtonSmall}>
                  <Ionicons name="download-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            );
          }
        })}
      </View>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      const emoji = reaction.emoji;
      if (!acc[emoji]) {
        acc[emoji] = [];
      }
      acc[emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>);

    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.reactionBubble,
              reactions.some(r => r.user._id === currentUser._id) && styles.userReaction
            ]}
            onPress={() => handleReaction(emoji)}
            disabled={isLoading}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{reactions.length}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReplyPreview = () => {
    if (!message.replyToMessage && !message.replyTo) return null;

    // Handle both replyToMessage object and replyTo ID
    const replyMessage = message.replyToMessage || 
      (message.replyTo ? allChatMessages.find(msg => msg._id === message.replyTo) : null);
    
    if (!replyMessage) return null;

    return (
      <View style={[
        styles.replyPreview,
        isCurrentUser ? styles.currentUserReplyPreview : styles.otherUserReplyPreview
      ]}>
        <View style={[
          styles.replyLine,
          isCurrentUser ? styles.currentUserReplyLine : styles.otherUserReplyLine
        ]} />
        <View style={styles.replyContent}>
          <Text style={[
            styles.replySender,
            isCurrentUser ? styles.currentUserReplySender : styles.otherUserReplySender
          ]}>
            Replying to {replyMessage.sender.name}
          </Text>
          <Text style={[
            styles.replyText,
            isCurrentUser ? styles.currentUserReplyText : styles.otherUserReplyText
          ]} numberOfLines={2}>
            {replyMessage.content || 'Message'}
          </Text>
          {replyMessage.attachments && replyMessage.attachments.length > 0 && (
            <Text style={[
              styles.attachmentText,
              isCurrentUser ? styles.currentUserAttachmentText : styles.otherUserAttachmentText
            ]}>
              📎 {replyMessage.attachments.length} attachment(s)
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderMentions = () => {
    if (!message.mentions || message.mentions.length === 0) return null;

    let content = message.content;
    message.mentions.forEach(mention => {
      content = content.replace(
        new RegExp(`@${mention.name}`, 'g'),
        `@${mention.name}`
      );
    });

    return (
      <Text style={styles.messageText}>
        {content.split(/(@\w+)/).map((part, index) => {
          if (part.startsWith('@')) {
            const mention = message.mentions?.find(m => part === `@${m.name}`);
            return (
              <Text key={index} style={styles.mentionText}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
          {/* Pin Icon */}
          {(message.pinned || message.isPinned) && showPinIcon && (
            <View style={[
              styles.pinIndicator,
              isCurrentUser ? styles.currentUserPinIndicator : styles.otherUserPinIndicator
            ]}>
              <Ionicons 
                name="pin" 
                size={14} 
                color={isCurrentUser ? "rgba(255, 255, 255, 0.9)" : "#3b82f6"} 
              />
              <Text style={[
                styles.pinText,
                isCurrentUser ? styles.currentUserPinText : styles.otherUserPinText
              ]}>
                Pinned
              </Text>
            </View>
          )}

      {/* Reply Preview */}
      {renderReplyPreview()}

      {/* Message Content */}
      <View style={[
        styles.bubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        {/* Sender Name for Group Chats */}
        {!isCurrentUser && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}

        {/* Message Text */}
        {message.type === 'text' ? (
          message.mentions && message.mentions.length > 0 ? (
            renderMentions()
          ) : (
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {message.content}
            </Text>
          )
        ) : (
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {message.content}
          </Text>
        )}

        {/* Attachments */}
        {renderAttachments()}

        {/* Reactions */}
        {showReactions && renderReactions()}

        {/* Timestamp */}
        <Text style={[
          styles.timestamp,
          isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
        ]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>

      {/* Message Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReactionPicker(!showReactionPicker)}
        >
          <Ionicons name="happy-outline" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReply(message)}
        >
          <Ionicons name="arrow-undo-outline" size={16} color="#666" />
        </TouchableOpacity>

        {isCurrentUser && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit?.(message)}
            >
              <Ionicons name="create-outline" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color="#ff4444" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePin}
          disabled={isLoading}
        >
          <Ionicons 
            name={message.pinned || message.isPinned ? "pin" : "pin-outline"} 
            size={16} 
            color={message.pinned || message.isPinned ? "#007AFF" : "#666"} 
          />
        </TouchableOpacity>
      </View>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <View style={styles.reactionPicker}>
          {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionPickerItem}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    maxWidth: screenWidth * 0.8,
  },
  currentUserContainer: {
    alignSelf: 'flex-end',
  },
  otherUserContainer: {
    alignSelf: 'flex-start',
  },
      pinIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#dbeafe',
      },
      currentUserPinIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      otherUserPinIndicator: {
        backgroundColor: '#eff6ff',
        borderColor: '#dbeafe',
      },
      pinText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
        color: '#3b82f6',
      },
      currentUserPinText: {
        color: 'rgba(255, 255, 255, 0.9)',
      },
      otherUserPinText: {
        color: '#3b82f6',
      },
  bubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  currentUserBubble: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F1F1F1',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },
  mentionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherUserTimestamp: {
    color: '#666',
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentItem: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  fileName: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
      replyPreview: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
      },
      currentUserReplyPreview: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      },
      otherUserReplyPreview: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
      },
      replyLine: {
        width: 3,
        backgroundColor: '#007AFF',
        marginRight: 8,
        borderRadius: 2,
      },
      currentUserReplyLine: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      },
      otherUserReplyLine: {
        backgroundColor: '#007AFF',
      },
      replyContent: {
        flex: 1,
      },
      replySender: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 2,
      },
      currentUserReplySender: {
        color: 'rgba(255, 255, 255, 0.9)',
      },
      otherUserReplySender: {
        color: '#007AFF',
      },
      replyText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
      },
      currentUserReplyText: {
        color: 'rgba(255, 255, 255, 0.8)',
      },
      otherUserReplyText: {
        color: '#666',
      },
      attachmentText: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
        fontStyle: 'italic',
      },
      currentUserAttachmentText: {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      otherUserAttachmentText: {
        color: '#666',
      },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  userReaction: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    opacity: 0.7,
  },
  actionButton: {
    padding: 4,
    marginRight: 8,
  },
  reactionPicker: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reactionPickerItem: {
    padding: 8,
    marginHorizontal: 4,
  },
  reactionPickerEmoji: {
    fontSize: 20,
  },
  // Attachment styles
  attachmentsContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  imageAttachment: {
    width: 200,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 5,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  downloadButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserFileAttachment: {
    backgroundColor: '#FFE5D9',
  },
  otherUserFileAttachment: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentUserFileName: {
    color: '#000',
  },
  otherUserFileName: {
    color: '#333',
  },
  fileType: {
    fontSize: 12,
    marginBottom: 2,
  },
  currentUserFileType: {
    color: '#666',
  },
  otherUserFileType: {
    color: '#666',
  },
  fileSize: {
    fontSize: 11,
  },
  currentUserFileSize: {
    color: '#888',
  },
  otherUserFileSize: {
    color: '#888',
  },
  downloadButtonSmall: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default MessageBubble;
