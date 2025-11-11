import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message } from '../types/chattypes';
import MessageBubble from './MessageBubble';

interface PinnedMessagesHeaderProps {
  pinnedMessages: Message[];
  onClose: () => void;
  onMessagePress?: (message: Message) => void;
  currentUser: any;
}

const PinnedMessagesHeader: React.FC<PinnedMessagesHeaderProps> = ({
  pinnedMessages,
  onClose,
  onMessagePress,
  currentUser,
}) => {
  if (pinnedMessages.length === 0) return null;

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.pinIconContainer}>
            <Ionicons name="pin" size={16} color="#007AFF" />
          </View>
          <Text style={styles.headerTitle}>Pinned Messages</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pinnedMessages.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {pinnedMessages.map((message, index) => (
          <TouchableOpacity
            key={message._id || message.messageId}
            style={styles.messageContainer}
            onPress={() => onMessagePress?.(message)}
          >
            <View style={styles.messageBubble}>
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{message.sender.name}</Text>
                <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
              </View>
              <Text style={styles.messageContent} numberOfLines={2}>
                {message.content || 'Message'}
              </Text>
              {message.attachments && message.attachments.length > 0 && (
                <Text style={styles.attachmentText}>
                  📎 {message.attachments.length} attachment(s)
                </Text>
              )}
              <View style={styles.pinIndicator}>
                <Ionicons name="pin" size={12} color="#007AFF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    maxHeight: 90,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginRight: 12,
    maxWidth: 220,
    minWidth: 180,
  },
  messageBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    flex: 1,
  },
  messageTime: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  messageContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 4,
  },
  attachmentText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  pinIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PinnedMessagesHeader;
