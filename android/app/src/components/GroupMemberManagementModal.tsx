import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { User, ChatMember } from '../types/chattypes';
import { addMember, removeMember, getChatMembers } from '../Services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

interface GroupMemberManagementModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  currentMembers: User[];
  allUsers: User[];
  currentUser: User;
  onMembersUpdated?: () => void;
}

const GroupMemberManagementModal: React.FC<GroupMemberManagementModalProps> = ({
  visible,
  onClose,
  chatId,
  currentMembers,
  allUsers,
  currentUser,
  onMembersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<User[]>(currentMembers);
  const token = useSelector((state: RootState) => state.user.token);

  useEffect(() => {
    if (visible) {
      setMembers(currentMembers);
      setSearchQuery('');
      setActiveTab('members');
    }
  }, [visible, currentMembers]);

  // Filter users that are not already members
  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map(m => m._id));
    return allUsers.filter(user => 
      user._id !== currentUser._id && !memberIds.has(user._id)
    );
  }, [allUsers, members, currentUser._id]);

  // Filter available users by search query
  const filteredAvailableUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user =>
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  // Filter current members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(user =>
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const handleAddMember = async (userId: string) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await addMember(chatId, userId, token);
      
      // Fetch updated members list (with fallback)
      try {
        const response = await getChatMembers(chatId, token);
        const updatedMembers = (response.members || [])
          .map((m: any) => m?.user || m)
          .filter((user: any) => user && user._id)
          .map((user: any) => ({
            _id: user._id || user.id,
            name: user.name || user.fullName || '',
            email: user.email || '',
            profilePic: user.profilePic || user.avatar || '',
            avatar: user.profilePic || user.avatar || ''
          }));
        
        setMembers(updatedMembers);
      } catch (error: any) {
        // If API fails, add the user to members list optimistically
        const newUser = allUsers.find(u => u._id === userId);
        if (newUser) {
          setMembers(prev => [...prev, newUser]);
        }
      }
      onMembersUpdated?.();
      Alert.alert('Success', 'Member added successfully');
    } catch (error: any) {
      console.error('Failed to add member:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!token) return;

    // Prevent removing yourself
    if (userId === currentUser._id) {
      Alert.alert('Error', 'You cannot remove yourself from the group');
      return;
    }

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await removeMember(chatId, userId, token);
              
              // Fetch updated members list (with fallback)
              try {
                const response = await getChatMembers(chatId, token);
                const updatedMembers = (response.members || [])
                  .map((m: any) => m?.user || m)
                  .filter((user: any) => user && user._id)
                  .map((user: any) => ({
                    _id: user._id || user.id,
                    name: user.name || user.fullName || '',
                    email: user.email || '',
                    profilePic: user.profilePic || user.avatar || '',
                    avatar: user.profilePic || user.avatar || ''
                  }));
                
                setMembers(updatedMembers);
              } catch (error: any) {
                // If API fails, remove the user from members list optimistically
                setMembers(prev => prev.filter(m => m._id !== userId));
              }
              onMembersUpdated?.();
              Alert.alert('Success', 'Member removed successfully');
            } catch (error: any) {
              console.error('Failed to remove member:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMemberItem = ({ item }: { item: User }) => {
    const isCurrentUser = item._id === currentUser._id;
    
    return (
      <View style={styles.memberItem}>
        {item.avatar || item.profilePic ? (
          <Image
            source={{ uri: item.avatar || item.profilePic }}
            style={styles.memberAvatar}
          />
        ) : (
          <View style={[styles.memberAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{getInitials(item.name || 'U')}</Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.name} {isCurrentUser && '(You)'}
          </Text>
          {item.email && (
            <Text style={styles.memberEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
        {!isCurrentUser && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item._id)}
            disabled={isLoading}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAvailableUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => handleAddMember(item._id)}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {item.avatar || item.profilePic ? (
        <Image
          source={{ uri: item.avatar || item.profilePic }}
          style={styles.memberAvatar}
        />
      ) : (
        <View style={[styles.memberAvatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{getInitials(item.name || 'U')}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        {item.email && (
          <Text style={styles.memberEmail} numberOfLines={1}>
            {item.email}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.addButton}
        disabled={isLoading}
      >
        <Ionicons name="add-circle" size={24} color="#10B981" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Members</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Ionicons
              name="people"
              size={20}
              color={activeTab === 'members' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'members' && styles.activeTabText,
              ]}
            >
              Members ({members.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'add' && styles.activeTab]}
            onPress={() => setActiveTab('add')}
          >
            <Ionicons
              name="person-add"
              size={20}
              color={activeTab === 'add' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'add' && styles.activeTabText,
              ]}
            >
              Add Member
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === 'members' ? 'members' : 'users'}...`}
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

        {/* Content */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}

        {activeTab === 'members' ? (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item._id}
            renderItem={renderMemberItem}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No members found</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredAvailableUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderAvailableUserItem}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : 'All users are already members'}
                </Text>
              </View>
            }
          />
        )}
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
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberAvatar: {
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
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default GroupMemberManagementModal;

