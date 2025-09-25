import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Chat, User } from '../types/chattypes';

interface ChatHeaderProps {
  chat: Chat;
  currentUser: User;
  onTogglePinned: () => void;
  onlineUsers: string[];
  onBack: () => void;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  isInCall?: boolean;
  showCallButtons?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  currentUser,
  onTogglePinned,
  onlineUsers,
  onBack,
  onStartVoiceCall,
  onStartVideoCall,
  isInCall = false,
  showCallButtons = false,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(prev => !prev);

  const getOtherMember = useCallback(() => {
    if (chat.isGroup) return null;
    if (!chat.members || chat.members.length === 0) return null;

    const processedMembers = chat.members.map(member => {
      if (typeof member === 'string') {
        return { _id: member, name: 'Unknown User', avatar: '' };
      }

      const memberId = member.id;
      if (!memberId) return null;

      return {
        _id: memberId,
        name: member.name || 'Unknown User',
        avatar: member.profilePic || member.avatar || '',
      };
    }).filter(member => member !== null);

    if (processedMembers.length === 0) return null;

    const otherMember = processedMembers.find(member => member._id !== currentUser._id);

    return otherMember || processedMembers[0];
  }, [chat.members, chat.isGroup, currentUser._id]);

  const otherMember = getOtherMember();
  const otherMemberId = otherMember?._id;

  const validOnlineUsers = onlineUsers.filter(
    userId => userId !== null && userId !== undefined && typeof userId === 'string'
  );

  const isOtherUserOnline = otherMemberId
    ? validOnlineUsers.includes(otherMemberId)
    : false;

  const getChatName = () => {
    if (chat.name) return chat.name;
    if (otherMember) return otherMember.name || 'Unknown User';
    return 'Unknown User';
  };

  const getOnlineStatus = () => {
    if (chat.isGroup) {
      const onlineCount = chat.members.filter(m => {
        const memberId = typeof m === 'object' ? m._id : m;
        return memberId !== currentUser._id && validOnlineUsers.includes(memberId);
      }).length;
      return `${onlineCount} online`;
    } else {
      return isOtherUserOnline ? 'Online' : 'Offline';
    }
  };

  const shouldShowCallButtons = !chat.isGroup && !isInCall && isOtherUserOnline && showCallButtons;

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
              uri: chat.avatar || otherMember?.avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
            }}
            style={styles.avatar}
          />
          {!chat.isGroup && isOtherUserOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{getChatName()}</Text>
          <Text style={styles.status}>{getOnlineStatus()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {/* Voice Call Button (directly visible) */}
        {shouldShowCallButtons && (
          <TouchableOpacity onPress={onStartVoiceCall} style={styles.actionButton}>
            <Ionicons name="call" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}

        {/* Group Members icon (for group chats) */}
        {chat.isGroup && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={20} color="#374151" />
          </TouchableOpacity>
        )}

        {/* Three-dot menu */}
        <TouchableOpacity style={styles.actionButton} onPress={toggleMenu}>
          <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); onTogglePinned(); }}>
            <Ionicons name="pin" size={20} color="#374151" style={styles.menuIcon} />
            <Text style={styles.menuText}>Pin Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="search" size={20} color="#374151" style={styles.menuIcon} />
            <Text style={styles.menuText}>Search</Text>
          </TouchableOpacity>
          {shouldShowCallButtons && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); onStartVideoCall(); }}>
              <Ionicons name="videocam" size={20} color="#007AFF" style={styles.menuIcon} />
              <Text style={styles.menuText}>Video Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    position: 'relative',
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
  menu: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 14,
    color: '#111827',
  },
});

export default ChatHeader;
