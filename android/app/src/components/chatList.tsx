import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Search, Users, MessageSquare, Plus } from 'react-native-feather';
import { Chat, User } from '../types/chattypes';
import ChatListItem from './chatListItems';
import CreateGroupModal from './CreateGroupModal';
import { Employee } from '../types';
import useAxios from '../hooks/useAxios';
import useChat from '../hooks/useChat';

interface ChatListProps {
  currentUser: User;
  selectedChat: Chat | null;
  searchQuery: string;
  myChatLoading: boolean;
  onSearchChange: (query: string) => void;
  onChatSelect: (chat: Chat) => void;
  chats: Chat[];
}

type ChatFilter = "all" | "groups" | "direct";

const ChatList: React.FC<ChatListProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  selectedChat,
  onChatSelect,
  myChatLoading,
  chats,
}) => {
  const [filteredChats, setFilteredChats] = React.useState<Chat[]>([]);
  const [chatFilter, setChatFilter] = React.useState<ChatFilter>("all");
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = React.useState(false);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { callApi } = useAxios();
  const { fetchMyChats } = useChat();

  React.useEffect(() => {
    // Alert.alert('in chat list')
    let filtered = chats || [];

    if (chatFilter === "groups") {
      filtered = filtered.filter((chat) => chat.isGroup);
    } else if (chatFilter === "direct") {
      filtered = filtered.filter((chat) => !chat.isGroup);
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (chat) =>
          chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.members?.some(
            (member) =>
              member.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
              member._id !== currentUser._id
          )
      );
    }

    setFilteredChats(filtered);
  }, [chats, searchQuery, currentUser._id, chatFilter]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const employeesRes = await callApi({ method: "GET", url: "/employee" });
        setEmployees(employeesRes?.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChatSelect = (chat: Chat) => {
    onChatSelect(chat);
  };

  const handleCreateGroup = async (groupData: {
    name: string;
    members: string[];
  }) => {
    try {
      const response = await callApi({
        method: "POST",
        url: "/chats/createGroup",
        data: groupData,
      });
      fetchMyChats();
    } catch (error) {
      console.log("Error while creating group");
    }
  };

  if (myChatLoading) {
    return (
      <View style={styles.container}>
        {/* Search Bar Skeleton */}
        <View style={styles.searchContainer}>
          <View style={styles.searchSkeleton} />
        </View>

        {/* Chat List Skeleton */}
        <View style={styles.listContainer}>
          {[...Array(6)].map((_, index) => (
            <ChatListSkeleton key={index} />
          ))}
        </View>

        {/* Footer Skeleton */}
        <View style={styles.footer}>
          <View style={styles.footerButtonSkeleton} />
          <View style={styles.footerButtonSkeleton} />
          <View style={styles.footerButtonSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search width={16} height={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ChatListItem
            key={item._id}
            chat={item}
            currentUser={currentUser}
            isSelected={selectedChat?._id === item._id}
            onSelect={handleChatSelect}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No chats found{chatFilter !== "all" ? ` in ${chatFilter}` : ""}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => setChatFilter(chatFilter === "groups" ? "all" : "groups")}
          style={[
            styles.footerButton,
            chatFilter === "groups" && styles.activeFooterButton
          ]}
          accessibilityLabel="Show group chats"
        >
          <Users width={20} height={20} color={chatFilter === "groups" ? "#111827" : "#6B7280"} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setChatFilter(chatFilter === "direct" ? "all" : "direct")}
          style={[
            styles.footerButton,
            chatFilter === "direct" && styles.activeFooterButton
          ]}
          accessibilityLabel="Show direct messages"
        >
          <MessageSquare width={20} height={20} color={chatFilter === "direct" ? "#111827" : "#6B7280"} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsCreateGroupModalOpen(true)}
          style={styles.footerButton}
          accessibilityLabel="Create new group"
        >
          <Plus width={20} height={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <CreateGroupModal
        isVisible={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        users={employees}
      />
    </View>
  );
};

// Skeleton Component
const ChatListSkeleton = () => (
  <View style={styles.skeletonItem}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonShortLine]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  searchSkeleton: {
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  footerButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  activeFooterButton: {
    backgroundColor: '#E5E7EB',
  },
  footerButtonSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonShortLine: {
    width: '60%',
    marginBottom: 0,
  },
});

export default ChatList;