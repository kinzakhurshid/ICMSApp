import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message, User } from '../types/chattypes';
import { getPinnedMessages, unpinMessage } from '../Services/api';
import { useSocket } from '../Context/SocketContext';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import MessageBubble from './MessageBubble';

interface PinnedMessagesProps {
  chatId: string;
  currentUser: User;
  onClose: () => void;
  onReply: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  chatId,
  currentUser,
  onClose,
  onReply,
  onEdit,
  onDelete,
}) => {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);

  useEffect(() => {
    loadPinnedMessages();
  }, [chatId]);

  useEffect(() => {
    if (!socket) return;

    const handlePinMessage = (data: any) => {
      if (data.chatId === chatId) {
        loadPinnedMessages();
      }
    };

    const handleUnpinMessage = (data: any) => {
      if (data.chatId === chatId) {
        setPinnedMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    const handleRefetchChatDetails = (data: any) => {
      if (data.chatId === chatId) {
        loadPinnedMessages();
      }
    };

    socket.on('PIN_MESSAGE', handlePinMessage);
    socket.on('UNPIN_MESSAGE', handleUnpinMessage);
    socket.on('REFETCH_CHAT_DETAILS', handleRefetchChatDetails);

    return () => {
      socket.off('PIN_MESSAGE', handlePinMessage);
      socket.off('UNPIN_MESSAGE', handleUnpinMessage);
      socket.off('REFETCH_CHAT_DETAILS', handleRefetchChatDetails);
    };
  }, [socket, chatId]);

  const loadPinnedMessages = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getPinnedMessages(chatId, token);
      setPinnedMessages(response.pinnedMessages || []);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
      setError('Failed to load pinned messages');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId: string) => {
    if (!token) return;
    
    try {
      await unpinMessage(messageId, token);
      
      // Emit socket event
      socket?.emit('UNPIN_MESSAGE', {
        messageId,
        chatId
      });
      
      // Update local state
      setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Failed to unpin message:', error);
      Alert.alert('Error', 'Failed to unpin message');
    }
  };

  const handlePin = (messageId: string) => {
    // This would typically be handled by the parent component
    // since we're in the pinned messages view
    console.log('Pin message:', messageId);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'long' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <MessageBubble
        message={item}
        isCurrentUser={item.sender._id === currentUser._id}
        currentUser={currentUser}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onPin={handlePin}
        onUnpin={handleUnpin}
        showReactions={false}
        showPinIcon={false}
      />
      <TouchableOpacity
        style={styles.unpinButton}
        onPress={() => handleUnpin(item._id)}
      >
        <Ionicons name="pin" size={16} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const renderDateGroup = ({ item }: { item: { date: string; messages: Message[] } }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>{item.date}</Text>
      {item.messages.map((message) => (
        <View key={message._id} style={styles.messageContainer}>
          <MessageBubble
            message={message}
            isCurrentUser={message.sender._id === currentUser._id}
            currentUser={currentUser}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={handlePin}
            onUnpin={handleUnpin}
            showReactions={false}
            showPinIcon={false}
          />
          <TouchableOpacity
            style={styles.unpinButton}
            onPress={() => handleUnpin(message._id)}
          >
            <Ionicons name="pin" size={16} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const groupedMessages = Object.entries(groupMessagesByDate(pinnedMessages))
    .map(([date, messages]) => ({ date, messages }))
    .sort((a, b) => {
      // Sort by most recent first
      const aDate = new Date(a.messages[0].createdAt);
      const bDate = new Date(b.messages[0].createdAt);
      return bDate.getTime() - aDate.getTime();
    });

  if (loading) {
    return (
      <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Pinned Messages</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading pinned messages...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Pinned Messages</Text>
          <TouchableOpacity onPress={loadPinnedMessages} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPinnedMessages}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : pinnedMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pin" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Pinned Messages</Text>
            <Text style={styles.emptySubtitle}>
              Pin important messages to keep them easily accessible
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupedMessages}
            keyExtractor={(item) => item.date}
            renderItem={renderDateGroup}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  messagesList: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  unpinButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 16,
    marginTop: 4,
  },
});

export default PinnedMessages;
