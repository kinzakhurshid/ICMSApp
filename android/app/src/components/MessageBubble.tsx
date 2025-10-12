import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message, User, Reaction } from '../types/chattypes';
import { useSocket } from '../Context/SocketContext';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import ReactionPicker from './ReactionPicker';
import MessageMenu from './MessageMenu';
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
  allChatMessages?: Message[];
  memberRoles?: Record<string, string>;
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
  allChatMessages = [],
  memberRoles = {},
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<Reaction | null>(null);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('top');
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<View>(null);
  const bubbleRef = useRef<View>(null);
  const { socket } = useSocket();

  // Deterministic sender name colors
  const NAME_COLOR_CLASSES = [
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#3b82f6', // sky-500
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
  ];

  const getDeterministicIndex = (key: string, modulo: number) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % modulo;
  };

  const getSenderNameColorClass = (sender: {
    _id?: string;
    email?: string;
    name?: string;
  }) => {
    const key = sender?._id || sender?.email || sender?.name || '';
    if (!key) return '#374151';
    const idx = getDeterministicIndex(key, NAME_COLOR_CLASSES.length);
    return NAME_COLOR_CLASSES[idx];
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReaction = (emoji: string) => {
    socket?.emit('NEW_REACTION', {
      chatId: message.chat,
      messageId: message.messageId,
      reaction: emoji,
      userId: currentUser._id,
    });
    setShowReactionPicker(false);
  };

  const handleReactionClick = (reactions: Reaction[]) => {
    setSelectedReaction(reactions[0]);
    setShowReactionDetails(true);
  };

  // Calculate position based on viewport
  const calculateMenuPosition = () => {
    // For now, we'll use a simple approach that works better for most cases
    // Always show menu above the message to avoid keyboard interference
    return 'top';
  };

  const handleMenuClick = () => {
    const position = calculateMenuPosition() as 'top' | 'bottom';
    setMenuPosition(position);
    setShowMenu(!showMenu);
  };

  const handleMessagePress = () => {
    setShowActions(!showActions);
  };

  const handleReactionPickerClick = () => {
    const position = calculateMenuPosition() as 'top' | 'bottom';
    setMenuPosition(position);
    setShowReactionPicker(!showReactionPicker);
  };

  // New functions to handle edit and reply
  const handleEdit = (message: Message) => {
    if (onEdit) {
      onEdit(message);
    }
    setShowMenu(false);
  };

  const handleReply = (message: Message) => {
    onReply(message);
    setShowMenu(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker(false);
      setShowMenu(false);
      setShowReactionDetails(false);
    };

    // In React Native, we'll handle this differently
    return handleClickOutside;
  }, []);

  // Close other menus when one opens
  useEffect(() => {
    if (showReactionPicker) {
      setShowMenu(false);
      setShowReactionDetails(false);
    }
  }, [showReactionPicker]);

  useEffect(() => {
    if (showMenu) {
      setShowReactionPicker(false);
      setShowReactionDetails(false);
    }
  }, [showMenu]);

  useEffect(() => {
    if (showReactionDetails) {
      setShowReactionPicker(false);
      setShowMenu(false);
    }
  }, [showReactionDetails]);

  // Group reactions by emoji
  const groupedReactions =
    message.reactions?.reduce((acc, reaction) => {
      const emoji = reaction.emoji;
      if (!acc[emoji]) {
        acc[emoji] = [];
      }
      // Convert to Reaction interface format
      const formattedReaction: Reaction = {
        emoji: reaction.emoji,
        userId: reaction.user._id,
        user: reaction.user
      };
      acc[emoji].push(formattedReaction);
      return acc;
    }, {} as Record<string, Reaction[]>) || {};

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
          isCurrentUser ? styles.currentUserReplyPreview : styles.otherUserReplyPreview
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

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        {message.attachments.map((attachment, index) => {
          const attachmentType = attachment.fileType || 'unknown';
          
          if (attachmentType.startsWith('image/') || attachmentType === 'image') {
            return (
              <View key={index} style={styles.imageAttachment}>
                <Image 
                  source={{ uri: attachment.url }} 
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
          } else {
            return (
              <AttachmentViewer
                key={index}
                attachments={[attachment]}
                isEditable={false}
              />
            );
          }
        })}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {/* Avatar for other users */}
      {!isCurrentUser && (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: message.sender.avatar || message.sender.profilePic }}
            style={styles.avatar}
          />
        </View>
      )}

      <View style={styles.messageContainer}>
        {/* Sender Name for Group Chats */}
        {!isCurrentUser && (
          <View style={styles.senderNameContainer}>
            <Text style={[styles.senderName, { color: getSenderNameColorClass(message.sender) }]}>
              {message.sender.name}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.bubble,
            message.attachments?.length > 0
              ? styles.bubbleWithAttachments
              : isCurrentUser
              ? styles.currentUserBubble
              : styles.otherUserBubble
          ]}
          onPress={handleMessagePress}
          activeOpacity={0.9}
        >
          {/* Reply indicator */}
          {message.replyTo && renderReplyPreview()}

          {/* Message content */}
          {message.content && (
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {message.content}
            </Text>
          )}

          {/* Attachments */}
          {renderAttachments()}

          {/* Message footer */}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
            ]}>
              {formatTime(message.createdAt)}
            </Text>

            {/* Message status */}
            {isCurrentUser && (
              <Text style={styles.messageStatus}>
                {message.readBy.length > 1 ? '✓✓' : '✓'}
              </Text>
            )}
          </View>

          {/* Reactions */}
          {message?.reactions?.length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBubble}
                  onPress={() => handleReactionClick(reactions)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {reactions.length > 1 && (
                    <Text style={styles.reactionCount}>{reactions.length}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Message actions - Show when message is pressed */}
          {showActions && (
            <View style={[
              styles.messageActions,
              isCurrentUser ? styles.currentUserActions : styles.otherUserActions
            ]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReactionPickerClick}
            >
              <Ionicons name="happy-outline" size={12} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMenuClick}
            >
              <Ionicons name="ellipsis-horizontal" size={12} color="#666" />
            </TouchableOpacity>
          </View>
          )}
        </TouchableOpacity>

      </View>

      {/* Reaction picker - positioned outside message container */}
      {showReactionPicker && (
        <ReactionPicker
          onSelect={handleReaction}
          onClose={() => setShowReactionPicker(false)}
          position={isCurrentUser ? 'right' : 'left'}
          alignment={menuPosition}
        />
      )}

      {/* Message menu - positioned outside message container */}
      {showMenu && (
        <MessageMenu
          message={message}
          isCurrentUser={isCurrentUser}
          onClose={() => setShowMenu(false)}
          position={isCurrentUser ? 'right' : 'left'}
          alignment={menuPosition}
          onReply={handleReply} // Use the new handler
          onEdit={handleEdit} // Use the new handler
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageContainer: {
    maxWidth: screenWidth * 0.7,
  },
  senderNameContainer: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    position: 'relative',
  },
  bubbleWithAttachments: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  currentUserBubble: {
    backgroundColor: '#FF6B35',
  },
  otherUserBubble: {
    backgroundColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  editedIndicator: {
    fontSize: 12,
    marginRight: 4,
  },
  currentUserEditedIndicator: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserEditedIndicator: {
    color: '#6B7280',
  },
  timestamp: {
    fontSize: 12,
    marginRight: 4,
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserTimestamp: {
    color: '#6B7280',
  },
  messageStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: -16,
    right: 8,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 2,
  },
  messageActions: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserActions: {
    top: -20,
    right: 0,
  },
  otherUserActions: {
    top: -20,
    left: 0,
  },
  actionButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  // Reply preview styles
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
  },
  currentUserReplyPreview: {
    borderLeftColor: '#FFFFFF',
  },
  otherUserReplyPreview: {
    borderLeftColor: '#3B82F6',
  },
  replyLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  replyContent: {
    marginTop: 4,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentUserReplySender: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserReplySender: {
    color: '#3B82F6',
  },
  replyText: {
    fontSize: 12,
    opacity: 0.8,
  },
  currentUserReplyText: {
    color: '#FFFFFF',
  },
  otherUserReplyText: {
    color: '#1F2937',
  },
  attachmentText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  currentUserAttachmentText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserAttachmentText: {
    color: '#6B7280',
  },
  // Attachment styles
  attachmentsContainer: {
    marginTop: 8,
  },
  imageAttachment: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
});

export default MessageBubble;