import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message, Chat } from '../types/chattypes';

interface ForwardMessageModalProps {
  visible: boolean;
  onClose: () => void;
  message: Message;
  chats: Chat[];
  onForward: (chatIds: string[]) => Promise<boolean>;
  isLoading?: boolean;
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  visible,
  onClose,
  message,
  chats,
  onForward,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(chat =>
      chat.name?.toLowerCase().includes(query) ||
      chat.members?.some(m => {
        const memberName = typeof m === 'object' ? m.name : '';
        return memberName?.toLowerCase().includes(query);
      })
    );
  }, [chats, searchQuery]);

  const toggleChatSelection = (chatId: string) => {
    setSelectedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const handleForward = async () => {
    console.log('🔍 [ForwardModal] handleForward called');
    console.log('🔍 [ForwardModal] selectedChats:', Array.from(selectedChats));
    
    if (selectedChats.size === 0) {
      console.warn('🔍 [ForwardModal] No chats selected');
      return;
    }
    
    console.log('🔍 [ForwardModal] Calling onForward...');
    try {
      const success = await onForward(Array.from(selectedChats));
      console.log('🔍 [ForwardModal] onForward result:', success);
      
      if (success) {
        // Success - modal will be closed by onForward
        console.log('🔍 [ForwardModal] Forward successful, modal will close');
      } else {
        // Failure - keep modal open and selection intact
        console.log('🔍 [ForwardModal] Forward failed, keeping modal open');
      }
    } catch (error) {
      // Error occurred - keep modal open
      console.error('🔍 [ForwardModal] Forward error caught:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.members && chat.members.length > 0) {
      const member = chat.members[0];
      return typeof member === 'object' ? member.name : 'Unknown';
    }
    return 'Unknown Chat';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar) return chat.avatar;
    if (chat.isGroup) return null;
    if (chat.members && chat.members.length > 0) {
      const member = chat.members[0];
      if (typeof member === 'object') {
        return member.avatar || member.profilePic;
      }
    }
    return null;
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const isSelected = selectedChats.has(item._id);
    const chatName = getChatName(item);
    const chatAvatar = getChatAvatar(item);

    return (
      <TouchableOpacity
        style={[styles.chatItem, isSelected && styles.chatItemSelected]}
        onPress={() => toggleChatSelection(item._id)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {chatAvatar ? (
          <Image source={{ uri: chatAvatar }} style={styles.chatAvatar} />
        ) : (
          <View style={[styles.chatAvatar, styles.avatarPlaceholder]}>
            {item.isGroup ? (
              <Ionicons name="people" size={20} color="#FFFFFF" />
            ) : (
              <Text style={styles.avatarText}>{getInitials(chatName)}</Text>
            )}
          </View>
        )}
        <View style={styles.chatInfo}>
          <Text style={styles.chatName} numberOfLines={1}>
            {chatName}
          </Text>
          {item.isGroup && (
            <Text style={styles.chatMeta}>
              {item.members?.length || 0} members
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessagePreview = () => {
    return (
      <View style={styles.messagePreview}>
        <View style={styles.messagePreviewHeader}>
          <Ionicons name="arrow-forward" size={16} color="#6B7280" />
          <Text style={styles.messagePreviewTitle}>Forwarding message</Text>
        </View>
        <View style={styles.messagePreviewContent}>
          {message.attachments && message.attachments.length > 0 ? (
            <View style={styles.attachmentPreview}>
              <Ionicons name="attach" size={16} color="#6B7280" />
              <Text style={styles.attachmentText} numberOfLines={1}>
                {message.attachments.length} attachment(s)
              </Text>
            </View>
          ) : (
            <Text style={styles.messagePreviewText} numberOfLines={2}>
              {message.content || 'Message'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forward Message</Text>
          <TouchableOpacity
            onPress={handleForward}
            style={[
              styles.forwardButton,
              (selectedChats.size === 0 || isLoading) && styles.forwardButtonDisabled,
            ]}
            disabled={selectedChats.size === 0 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.forwardButtonText}>
                Forward {selectedChats.size > 0 && `(${selectedChats.size})`}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Message Preview */}
        {renderMessagePreview()}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Chats List */}
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          style={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No chats found' : 'No chats available'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  forwardButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  forwardButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  forwardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messagePreview: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  messagePreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  messagePreviewContent: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  messagePreviewText: {
    fontSize: 14,
    color: '#1F2937',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
  },
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  chatMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default ForwardMessageModal;

