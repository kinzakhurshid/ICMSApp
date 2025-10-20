import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { InboxNotification } from '../Context/NotificationContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NotificationPopupProps {
  notification: InboxNotification;
  visible: boolean;
  onDismiss: () => void;
  onAction: (action: 'reply' | 'view' | 'mark_read') => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  visible,
  onDismiss,
  onAction,
}) => {
  const [showActions, setShowActions] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      showNotification();
    } else {
      hideNotification();
    }
  }, [visible]);

  const showNotification = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      if (visible) {
        onDismiss();
      }
    }, 5000);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -300,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getMessagePreview = () => {
    try {
      // Use the same simple logic as NotificationsScreen
      const messageContent = notification?.body || notification?.relatedMessage?.content || 'New message';
      console.log('🔍 NotificationPopup message content:', messageContent);
      console.log('🔍 NotificationPopup body:', notification?.body);
      console.log('🔍 NotificationPopup relatedMessage content:', notification?.relatedMessage?.content);
      return messageContent;
    } catch (error) {
      console.error('🔍 Error getting message preview:', error);
      return 'New message';
    }
  };

  const getSenderAvatar = () => {
    return notification.sender?.profilePicture || null;
  };

  // Function to extract sender name from message content (same as NotificationsScreen)
  const extractSenderNameFromMessage = (message: string): string | null => {
    if (!message || typeof message !== 'string') return null;
    
    // Look for patterns like "You have a new message from [Name]"
    const fromMatch = message.match(/from\s+([^,\n]+)/i);
    if (fromMatch && fromMatch[1]) {
      return fromMatch[1].trim();
    }
    
    // Look for other patterns
    const nameMatch = message.match(/(?:message|notification)\s+from\s+([^,\n]+)/i);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
    
    // Look for patterns like "[Name] sent a message"
    const sentMatch = message.match(/([^,\n]+)\s+sent\s+a\s+message/i);
    if (sentMatch && sentMatch[1]) {
      return sentMatch[1].trim();
    }
    
    // Look for patterns like "[Name]: message content"
    const colonMatch = message.match(/^([^:]+):\s*/);
    if (colonMatch && colonMatch[1]) {
      return colonMatch[1].trim();
    }
    
    return null;
  };

  const getChatTitle = () => {
    try {
      if (notification?.chat && notification.chat.type === 'group') {
        return notification.chat.name || 'Group Chat';
      }
      
      console.log('🔍 ===== NOTIFICATION POPUP DEBUG =====');
      console.log('🔍 Full notification object:', JSON.stringify(notification, null, 2));
      console.log('🔍 notification.sender:', JSON.stringify(notification?.sender, null, 2));
      console.log('🔍 notification.body:', notification?.body);
      console.log('🔍 notification.relatedMessage:', JSON.stringify(notification?.relatedMessage, null, 2));
      console.log('🔍 notification.metadata:', JSON.stringify(notification?.metadata, null, 2));
      console.log('🔍 notification.chat:', JSON.stringify(notification?.chat, null, 2));
      
      // Test each source individually
      console.log('🔍 Testing sender sources:');
      console.log('🔍 - notification.sender?.name:', notification?.sender?.name);
      console.log('🔍 - notification.sender?.username:', notification?.sender?.username);
      console.log('🔍 - notification.metadata?.senderName:', notification?.metadata?.senderName);
      console.log('🔍 - extractSenderNameFromMessage(body):', extractSenderNameFromMessage(notification?.body || ''));
      console.log('🔍 - extractSenderNameFromMessage(relatedMessage):', extractSenderNameFromMessage(notification?.relatedMessage?.content || ''));
      console.log('🔍 - notification.relatedMessage?.sender?.name:', notification?.relatedMessage?.sender?.name);
      console.log('🔍 - notification.relatedMessage?.sender?.username:', notification?.relatedMessage?.sender?.username);
      console.log('🔍 - notification.relatedMessage?.metadata?.senderName:', notification?.relatedMessage?.metadata?.senderName);
      
      // Use the same logic as NotificationsScreen - try all sources with OR operator
      const senderName = notification?.sender?.name || 
                        notification?.sender?.username || 
                        notification?.metadata?.senderName ||
                        notification?.relatedMessage?.metadata?.senderName ||
                        extractSenderNameFromMessage(notification?.body || '') ||
                        extractSenderNameFromMessage(notification?.relatedMessage?.content || '') ||
                        notification?.relatedMessage?.sender?.name ||
                        notification?.relatedMessage?.sender?.username ||
                        'Unknown User';
      
      console.log('🔍 FINAL sender name result:', senderName);
      console.log('🔍 ===== END DEBUG =====');
      return senderName;
    } catch (error) {
      console.error('🔍 Error getting chat title:', error);
      return 'Unknown User';
    }
  };

  const getTimeString = () => {
    try {
      const now = new Date();
      const notificationTime = new Date(notification?.createdAt || new Date());
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h`;
      } else {
        return `${Math.floor(diffInMinutes / 1440)}d`;
      }
    } catch (error) {
      console.error('🔍 Error getting time string:', error);
      return 'now';
    }
  };

  console.log('🔍 ===== NOTIFICATION POPUP RENDER =====');
  console.log('🔍 NotificationPopup render - visible:', visible, 'notification:', !!notification);
  console.log('🔍 NotificationPopup props:', { visible, notification: !!notification, onDismiss: !!onDismiss, onAction: !!onAction });
  console.log('🔍 NotificationPopup notification details:', notification ? {
    _id: notification._id,
    title: notification.title,
    body: notification.body,
    sender: notification.sender
  } : 'No notification');
  console.log('🔍 ===== END NOTIFICATION POPUP RENDER =====');
  
  if (!visible) {
    console.log('🔍 NotificationPopup: Not visible, returning null');
    return null;
  }
  
  if (!notification) {
    console.log('🔍 NotificationPopup: No notification, returning null');
    return null;
  }
  
  console.log('🔍 NotificationPopup: Rendering popup with notification:', notification._id);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.notificationContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notificationCard}
            onPress={() => setShowActions(!showActions)}
            activeOpacity={0.95}
          >
            {/* WhatsApp-style Header */}
            <View style={styles.header}>
              <View style={styles.senderSection}>
                <View style={styles.avatarContainer}>
                  {getSenderAvatar() ? (
                    <Image source={{ uri: getSenderAvatar() }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.defaultAvatar]}>
                      <Text style={styles.avatarText}>
                        {getChatTitle().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
                
                <View style={styles.senderInfo}>
                  <Text style={styles.senderName} numberOfLines={1}>
                    {getChatTitle()}
                  </Text>
                  <Text style={styles.timestamp}>
                    {getTimeString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onDismiss}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Icon name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Message Content */}
            <View style={styles.messageSection}>
              <Text style={styles.messageText} numberOfLines={3}>
                {getMessagePreview()}
              </Text>
            </View>

            {/* Action Buttons */}
            {showActions && (
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.replyButton]}
                  onPress={() => {
                    onAction('reply');
                    setShowActions(false);
                  }}
                >
                  <Icon name="arrow-undo" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => {
                    onAction('view');
                    setShowActions(false);
                  }}
                >
                  <Icon name="chatbubble" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Open Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  notificationContainer: {
    width: screenWidth - 32,
    maxWidth: 400,
    zIndex: 999999,
    elevation: 999999,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  senderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  defaultAvatar: {
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSection: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '400',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  replyButton: {
    backgroundColor: '#25D366',
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NotificationPopup;




