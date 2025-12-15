import React, { memo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions 
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Chat, User, ChatMember } from "../types/chattypes";
import NotificationBadge from "./NotificationBadge";

interface Props {
  chat: Chat & { unreadCount?: number; lastUpdated?: number };
  currentUser: User;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
}

const { width } = Dimensions.get('window');

// Role badge styling configuration
const roleBadgeStyles: Record<string, { bg: string; text: string }> = {
  HR: { bg: "#FCE7F3", text: "#BE185D" },
  PM: { bg: "#F3E8FF", text: "#7C3AED" },
  Developer: { bg: "#DBEAFE", text: "#1D4ED8" },
  QA: { bg: "#DCFCE7", text: "#15803D" },
  Admin: { bg: "#FEE2E2", text: "#DC2626" },
  OrgAdmin: { bg: "#FED7AA", text: "#EA580C" },
  SuperAdmin: { bg: "#E0E7FF", text: "#4338CA" },
  Group: { bg: "#F3F4F6", text: "#374151" },
};

const avatarColors = [
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // yellow
  "#6366F1", // indigo
  "#14B8A6", // teal
];

const hashCode = (str: string): number => {
  if (!str || typeof str !== 'string') return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const generateAvatar = (name: string, userId: string) => {
  if (!name || typeof name !== 'string') {
    return { initials: '?', color: avatarColors[0] };
  }
  if (!userId || typeof userId !== 'string') {
    return { initials: '?', color: avatarColors[0] };
  }
  
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
  const colorIndex = Math.abs(hashCode(userId)) % avatarColors.length;
  return { initials, color: avatarColors[colorIndex] };
};

const ChatListItem: React.FC<Props> = ({ chat, currentUser, isSelected, onSelect }) => {
  // Safe text extraction functions
  const getChatName = (): string => {
    try {
      if (!chat) return "Unknown Chat";
      if (typeof chat.name === 'string' && chat.name.trim()) {
        return chat.name.trim();
      }
      if (Array.isArray(chat.members) && currentUser?._id) {
        const other = chat.members.find((m) => m?.id !== currentUser._id);
        if (other?.name && typeof other.name === 'string') {
          return other.name.trim();
        }
      }
      return "Unknown Chat";
    } catch (error) {
      return "Unknown Chat";
    }
  };

  const formatLastMessage = (message?: any): string => {
    try {
      if (!message || typeof message !== 'object') return "";
      
      if (message.content && typeof message.content === 'string') {
        const content = message.content.trim();
        return content.length > 30 ? `${content.substring(0, 30)}...` : content;
      }
      
      if (message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0) {
        const attachment = message.attachments[0];
        const fileType = attachment?.fileType || 'Attachment';
        return `📎 ${fileType}`;
      }
      
      return "";
    } catch (error) {
      return "";
    }
  };

  const formatTime = (date: any): string => {
    try {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const getUnreadCount = (): string => {
    try {
      if (!chat?.unreadCount || typeof chat.unreadCount !== 'number' || chat.unreadCount <= 0) {
        return '';
      }
      const count = chat.unreadCount > 99 ? "99+" : chat.unreadCount.toString();
      return count;
    } catch (error) {
      return '';
    }
  };

  // Safe component renderers
  const renderRoleBadge = () => {
    try {
      if (!chat) return null;
      
      if (chat.isGroup === true) {
        return (
          <View style={[styles.roleBadge, { backgroundColor: roleBadgeStyles.Group.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleBadgeStyles.Group.text }]}>
              Group
            </Text>
          </View>
        );
      }

      if (Array.isArray(chat.members) && currentUser?._id) {
        const otherMember = chat.members.find((m) => m?.id !== currentUser._id);
        const role = otherMember?.orgRole;
        
        if (role && typeof role === 'string' && roleBadgeStyles[role]) {
          return (
            <View style={[styles.roleBadge, { backgroundColor: roleBadgeStyles[role].bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleBadgeStyles[role].text }]}>
                {role}
              </Text>
            </View>
          );
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const renderAvatar = () => {
    try {
      if (!chat) {
        return (
          <View style={[styles.avatar, { backgroundColor: '#E5E7EB' }]}>
            <Ionicons name="people" size={20} color="#6B7280" />
          </View>
        );
      }

      if (chat.avatar && typeof chat.avatar === 'string' && chat.avatar.trim()) {
        return (
          <Image
            source={{ uri: chat.avatar.trim() }}
            style={styles.avatar}
          />
        );
      }

      if (!chat.isGroup && Array.isArray(chat.members) && currentUser?._id) {
        const otherMember = chat.members.find((m) => m?.id !== currentUser._id);
        if (otherMember?.name && otherMember?.id) {
          const { initials, color } = generateAvatar(otherMember.name, otherMember.id);
          return (
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>
                {initials}
              </Text>
            </View>
          );
        }
      }

      return (
        <View style={[styles.avatar, { backgroundColor: '#E5E7EB' }]}>
          <Ionicons name="people" size={20} color="#6B7280" />
        </View>
      );
    } catch (error) {
      return (
        <View style={[styles.avatar, { backgroundColor: '#E5E7EB' }]}>
          <Ionicons name="people" size={20} color="#6B7280" />
        </View>
      );
    }
  };

  const renderOnlineIndicator = () => {
    try {
      if (!chat || chat.isGroup === true) return null;
      
      if (Array.isArray(chat.members) && currentUser?._id) {
        const otherMember = chat.members.find((m) => m?.id !== currentUser._id);
        if (otherMember?.lastSeen) {
          const now = new Date().getTime();
          const lastSeen = new Date(otherMember.lastSeen).getTime();
          if ((now - lastSeen) < (1000 * 60 * 5)) { // 5 minutes
            return <View style={styles.onlineIndicator} />;
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Main render
  const chatName = getChatName();
  const lastMessage = formatLastMessage(chat?.lastMessage);
  const timeText = formatTime(chat?.updatedAt);
  const unreadCount = getUnreadCount();

  return (
    <TouchableOpacity 
      style={[styles.container, isSelected && styles.selectedContainer]} 
      onPress={() => onSelect(chat)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {renderAvatar()}
        {renderOnlineIndicator()}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.nameAndRole}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chatName.length > 15 ? `${chatName.substring(0, 15)}...` : chatName}
            </Text>
            {renderRoleBadge()}
          </View>
          
          <View style={styles.timeAndBadge}>
            <Text style={styles.timeText}>
              {timeText}
            </Text>
            {unreadCount && (
              <NotificationBadge
                count={unreadCount}
                size="medium"
                color="#FF6B35"
              />
            )}
          </View>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedContainer: {
    backgroundColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameAndRole: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default memo(ChatListItem);