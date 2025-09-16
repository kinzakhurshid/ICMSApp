import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Chat, User } from '../types/chattypes';

interface ChatHeaderProps {
  chat: Chat;
  currentUser: User;
  onTogglePinned: () => void;
  onlineUsers: string[];
  onBack: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  currentUser,
  onTogglePinned,
  onlineUsers,
  onBack,
}) => {
  const getChatName = () => {
    if (chat.name) return chat.name;
    const otherMember = chat.members.find((m) => m._id !== currentUser._id);
    return otherMember?.name || "Unknown";
  };

  const getOnlineStatus = () => {
    if (chat.isGroup) {
      const onlineCount = chat.members.filter(
        (m) =>
          m._id !== currentUser._id &&
          onlineUsers.includes(m._id)
      ).length;
      return `${onlineCount} online`;
    } else {
      const otherMember = chat.members.find((m) => m._id !== currentUser._id);
      if (!otherMember) return "";
      return onlineUsers.includes(otherMember._id) ? "Online" : "Offline";
    }
  };

  const isOnline = chat.members.some((member) =>
    onlineUsers.includes(member._id)
  );

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>

      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: chat.avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
            }}
            style={styles.avatar}
          />
          {!chat.isGroup && isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{getChatName()}</Text>
          <Text style={styles.status}>{getOnlineStatus()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="search" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onTogglePinned}>
          <Ionicons name="pin" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={20} color="#374151" />
        </TouchableOpacity>
        {chat.isGroup && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={20} color="#374151" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F9FAFB',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  status: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ChatHeader;