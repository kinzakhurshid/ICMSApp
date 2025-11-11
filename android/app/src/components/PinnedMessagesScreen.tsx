import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message, User } from '../types/chattypes';
import { getPinnedMessages, unpinMessage } from '../Services/api';

interface PinnedMessagesScreenProps {
  chatId: string;
  currentUser: User;
  onClose: () => void;
  onMessagePress: (message: Message) => void;
  token: string;
}

const PinnedMessagesScreen: React.FC<PinnedMessagesScreenProps> = ({
  chatId,
  currentUser,
  onClose,
  onMessagePress,
  token,
}) => {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPinnedMessages();
  }, [chatId]);

  const loadPinnedMessages = async () => {
    try {
      setLoading(true);
      const response = await getPinnedMessages(chatId, token);
      console.log('Pinned messages response:', response);
      
      // Handle different response formats
      const messages = response.pinnedMessages || response.messages || response || [];
      setPinnedMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
      setPinnedMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPinnedMessages();
  };

  const handleUnpin = async (messageId: string) => {
    Alert.alert(
      'Unpin Message',
      'Are you sure you want to unpin this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unpin',
          onPress: async () => {
            try {
              await unpinMessage(messageId, token);
              setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
            } catch (error) {
              console.error('Failed to unpin message:', error);
              Alert.alert('Error', 'Failed to unpin message');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return 'Unknown date';
    }
  };

  const renderPinnedMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender?._id === currentUser._id;
    
    return (
      <TouchableOpacity
        style={styles.messageCard}
        onPress={() => {
          onMessagePress(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <View style={[
              styles.senderAvatar,
              { backgroundColor: isCurrentUser ? '#F97316' : '#3B82F6' }
            ]}>
              <Text style={styles.senderAvatarText}>
                {item.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.senderDetails}>
              <Text style={styles.senderName}>
                {isCurrentUser ? 'You' : item.sender?.name || 'Unknown'}
              </Text>
              <Text style={styles.messageDate}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.unpinButton}
            onPress={() => handleUnpin(item._id)}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.messageContent}>
          {item.replyTo && (
            <View style={styles.replyIndicator}>
              <View style={styles.replyLine} />
              <Text style={styles.replyText} numberOfLines={1}>
                {item.replyToMessage?.content || 'Original message'}
              </Text>
            </View>
          )}
          
          <Text style={styles.messageText} numberOfLines={3}>
            {item.content || 'No content'}
          </Text>
          
          {item.type === 'attachment' && item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentIndicator}>
              <Ionicons name="attach" size={16} color="#6B7280" />
              <Text style={styles.attachmentText}>
                {item.attachments.length} {item.attachments.length === 1 ? 'attachment' : 'attachments'}
              </Text>
            </View>
          )}
          
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.slice(0, 3).map((reaction, index) => (
                <Text key={index} style={styles.reactionEmoji}>
                  {reaction.emoji}
                </Text>
              ))}
              {item.reactions.length > 3 && (
                <Text style={styles.reactionCount}>
                  +{item.reactions.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="pin" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Pinned Messages</Text>
      <Text style={styles.emptySubtitle}>
        Pin important messages to find them easily later
      </Text>
    </View>
  );

  return (
    <Modal
      visible={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Ionicons name="pin" size={20} color="#F97316" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Pinned Messages</Text>
          </View>
          
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Loading pinned messages...</Text>
          </View>
        ) : (
          <FlatList
            data={pinnedMessages}
            renderItem={renderPinnedMessage}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer Info */}
        {pinnedMessages.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {pinnedMessages.length} {pinnedMessages.length === 1 ? 'message' : 'messages'} pinned
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  senderAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  messageDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unpinButton: {
    padding: 4,
  },
  messageContent: {
    marginTop: 8,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 12,
  },
  replyLine: {
    width: 3,
    height: '100%',
    backgroundColor: '#F97316',
    marginRight: 8,
    borderRadius: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  attachmentText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default PinnedMessagesScreen;












