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
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      showNotification();
    } else {
      hideNotification();
    }
  }, [visible]);

  const showNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
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
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getMessagePreview = () => {
    const message = notification.message;
    
    switch (message.messageType) {
      case 'text':
        return message.content;
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Voice message';
      case 'document':
        return '📄 Document';
      default:
        return 'New message';
    }
  };

  const getSenderAvatar = () => {
    return notification.sender.avatar || notification.sender.profilePic || null;
  };

  const getChatTitle = () => {
    if (notification.chat.type === 'group') {
      return notification.chat.name || 'Group Chat';
    }
    return notification.sender.name;
  };

  const getTimeString = () => {
    const now = new Date();
    const notificationTime = new Date(notification.createdAt);
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
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
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
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.senderInfo}>
            {getSenderAvatar() ? (
              <Image source={{ uri: getSenderAvatar() }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {notification.sender.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={styles.senderDetails}>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Message Preview */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText} numberOfLines={2}>
            {getMessagePreview()}
          </Text>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.replyButton]}
              onPress={() => {
                onAction('reply');
                setShowActions(false);
              }}
            >
              <Icon name="arrow-undo" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => {
                onAction('view');
                setShowActions(false);
              }}
            >
              <Icon name="eye" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.markReadButton]}
              onPress={() => {
                onAction('mark_read');
                setShowActions(false);
              }}
            >
              <Icon name="checkmark-done" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Mark Read</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 10,
    right: 10,
    zIndex: 9999,
    elevation: 9999,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#25D366', // WhatsApp green
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  replyButton: {
    backgroundColor: '#25D366',
  },
  viewButton: {
    backgroundColor: '#3B82F6',
  },
  markReadButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default NotificationPopup;
