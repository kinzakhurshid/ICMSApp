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
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  onSearch?: () => void;
  isInCall?: boolean;
  showCallButtons?: boolean;
  pinnedMessagesCount?: number;
}

const ChatHeaderNew: React.FC<ChatHeaderProps> = ({
  chat,
  currentUser,
  onTogglePinned,
  onlineUsers,
  onBack,
  onStartVoiceCall,
  onStartVideoCall,
  onSearch,
  isInCall = false,
  showCallButtons = false,
  pinnedMessagesCount = 0,
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
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {chat.isGroup ? (
            <View style={styles.groupAvatar}>
              <Ionicons name="people" size={20} color="#6B7280" />
            </View>
          ) : (
            <Image
              source={{ 
                uri: otherMember?.avatar || 'https://via.placeholder.com/40'
              }}
              style={styles.avatar}
            />
          )}
          {!chat.isGroup && isOtherUserOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>
            {getChatName()}
          </Text>
          <Text style={styles.status} numberOfLines={1}>
            {getOnlineStatus()}
          </Text>
        </View>
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        {/* Search Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onSearch}
        >
          <Ionicons name="search" size={22} color="#6B7280" />
        </TouchableOpacity>

        {/* Voice Call Button - Only show for direct messages */}
        {!chat.isGroup && onStartVoiceCall && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onStartVoiceCall}
          >
            <Ionicons name="call" size={22} color="#6B7280" />
          </TouchableOpacity>
        )}

        {/* Menu Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={toggleMenu}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {/* Pinned Messages */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onTogglePinned();
                setMenuVisible(false);
              }}
            >
              <Ionicons name="pin" size={20} color="#F97316" />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Pinned Messages</Text>
                {pinnedMessagesCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pinnedMessagesCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Video Call - Only for direct messages */}
            {!chat.isGroup && onStartVideoCall && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  onStartVideoCall();
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="videocam" size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Video Call</Text>
              </TouchableOpacity>
            )}
            
            {/* Voice Call - Only for direct messages */}
            {!chat.isGroup && onStartVoiceCall && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  onStartVoiceCall();
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="call" size={20} color="#3B82F6" />
                <Text style={styles.menuItemText}>Voice Call</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.menuDivider} />
            
            {/* Chat Settings */}
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings" size={20} color="#6B7280" />
              <Text style={styles.menuItemText}>Chat Settings</Text>
            </TouchableOpacity>
            
            {/* Notifications */}
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="notifications" size={20} color="#6B7280" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>
            
            {/* Block/Report */}
            {!chat.isGroup && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="ban" size={20} color="#EF4444" />
                  <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Block User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    color: '#6B7280',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  badge: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatHeaderNew;
