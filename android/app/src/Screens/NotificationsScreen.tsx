import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { ArrowLeft, Bell, Check, MoreHorizontal, Menu } from 'react-native-feather';
import NotificationBadge from '../components/NotificationBadge';
import { useNotifications, InboxNotification } from '../Context/NotificationContext';

const { width } = Dimensions.get('window');

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  
  // Debug navigation - only log once when component mounts
  React.useEffect(() => {
    console.log('🔍 NotificationsScreen navigation:', navigation);
    console.log('🔍 Navigation can go back:', navigation.canGoBack?.());
    console.log('🔍 Navigation methods:', Object.keys(navigation));
  }, []);
  const {
    notifications,
    unreadCount,
    loading,
    notificationsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []); // Remove fetchNotifications dependency to prevent infinite loop

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleNotificationPress = async (notification: InboxNotification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    // Navigate to chat
    if (notification.chat?._id) {
      navigation.navigate('ChatWindow', { chatId: notification.chat._id });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      default:
        return '💬';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });


  // Function to extract sender name from message content
  const extractSenderNameFromMessage = (message: string): string => {
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
    
    return null;
  };

  const renderNotificationItem = ({ item }: { item: InboxNotification }) => {
    // Debug logging to understand the data structure
    console.log('🔍 Notification item data:', JSON.stringify(item, null, 2));
    console.log('🔍 Sender data:', item.sender);
    console.log('🔍 Related message:', item.relatedMessage);
    console.log('🔍 Body:', item.body);
    
    // Extract sender name from various sources
    const senderName = item.sender?.name || 
                      item.sender?.username || 
                      item.metadata?.senderName ||
                      extractSenderNameFromMessage(item.body || '') ||
                      extractSenderNameFromMessage(item.relatedMessage?.content || '') ||
                      'Unknown User';
    
    console.log('🔍 Extracted sender name:', senderName);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotificationItem,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.sender?.profilePicture || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
            <View style={styles.messageIconContainer}>
              <Text style={styles.messageIcon}>
                💬
              </Text>
            </View>
          </View>

          <View style={styles.notificationText}>
            <View style={styles.notificationHeader}>
              <Text style={styles.senderName} numberOfLines={1}>
                {senderName}
              </Text>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            </View>
            
            <Text style={styles.chatName} numberOfLines={1}>
              {item.chat?.name ? `in ${item.chat.name}` : 'in Chat'}
            </Text>
            
            <Text
              style={[
                styles.messageContent,
                !item.read && styles.unreadMessageContent,
              ]}
              numberOfLines={2}
            >
              {(() => {
                // Use the same logic as NotificationPopup for consistency
                const messageContent = item.body || item.relatedMessage?.content || 'New message';
                console.log('🔍 NotificationsScreen message content:', messageContent);
                console.log('🔍 NotificationsScreen item body:', item.body);
                console.log('🔍 NotificationsScreen relatedMessage content:', item.relatedMessage?.content);
                console.log('🔍 NotificationsScreen relatedMessage:', JSON.stringify(item.relatedMessage, null, 2));
                return messageContent;
              })()}
            </Text>
          </View>

          <View style={styles.notificationActions}>
            {!item.read && <View style={styles.unreadDot} />}
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => markAsRead(item._id)}
            >
              <Check size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={48} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No notifications yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        You'll see notifications for new messages and mentions here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.activeFilterTabText]}>
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <View style={styles.markAllContainer}>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {notificationsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  menuButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#1F2937',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadNotificationItem: {
    backgroundColor: '#FEF7F0',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  messageIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageIcon: {
    fontSize: 10,
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chatName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  unreadMessageContent: {
    fontWeight: '500',
    color: '#1F2937',
  },
  notificationActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginBottom: 8,
  },
  moreButton: {
    padding: 4,
  },
  markAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;