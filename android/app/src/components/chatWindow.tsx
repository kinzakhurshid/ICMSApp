import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  Keyboard,
} from 'react-native';

// Utility functions from website
const getDateGroupKey = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDate = new Date(date);
  const messageDateStr = messageDate.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  
  if (messageDateStr === todayStr) {
    return 'Today';
  } else if (messageDateStr === yesterdayStr) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

const getOrderedDateGroups = (groupedMessages: { [key: string]: Message[] }): string[] => {
  const groups = Object.keys(groupedMessages);
  return groups.sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(a).getTime() - new Date(b).getTime();
  });
};
import { Chat, Message, User, MessageSearchResult, ChatState, MentionSuggestion } from '../types/chattypes';
import { 
  getChatMessages, 
  sendMessage, 
  editMessage, 
  deleteMessage,
  getPinnedMessages,
  searchMessages,
  getChatMembers,
  addReaction,
  removeReaction,
  pinMessage,
  unpinMessage
} from '../Services/api';
import { useSocket } from '../Context/SocketContext';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import {
  NEW_MESSAGE,
  NEW_REACTION,
  ADD_REACTION,
  REMOVE_REACTION,
  PIN_MESSAGE,
  UNPIN_MESSAGE,
  DELETE_MESSAGE,
  UPDATE_MESSAGE,
  START_TYPING,
  STOP_TYPING,
  ONLINE_USERS,
  REFETCH_CHAT_DETAILS,
} from '../constants/events';

// Import components
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import PinnedMessages from './PinnedMessages';
import PinnedMessagesHeader from './PinnedMessagesHeader';
import TypingIndicator from './TypingIndicator';
import MessageSearch from './MessageSearch';

interface ChatWindowProps {
  chat: Chat;
  currentUser: { currentUser: User };
  onMarkAsRead: () => void;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  currentUser,
  onMarkAsRead,
  onBack,
}) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    groupedMessages: {},
    dateGroups: [],
    pinnedMessages: [],
    onlineUsers: [],
    typingUsers: [],
    searchResults: null,
    isSearching: false,
    isLoadingMessages: true,
    isLoadingPinned: false,
  });
  
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);
  const actualUser = currentUser.currentUser;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [chat._id]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      const newMessage = {
        ...data.message,
        id: data.message._id
      };
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage]
      }));
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleNewReaction = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      }));
    };

    const handleMessageUpdate = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === data.messageId
            ? { ...msg, ...data.message }
            : msg
        )
      }));
    };

    const handleMessageDelete = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg._id !== data.messageId)
      }));
    };

    const handlePinMessage = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === data.messageId
            ? { ...msg, pinned: true, isPinned: true }
            : msg
        )
      }));
      
      loadPinnedMessages();
    };

    const handleUnpinMessage = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === data.messageId
            ? { ...msg, pinned: false, isPinned: false }
            : msg
        ),
        pinnedMessages: prev.pinnedMessages.filter(msg => msg._id !== data.messageId)
      }));
    };

    const handleOnlineUsers = (data: any) => {
      setChatState(prev => ({
        ...prev,
        onlineUsers: Array.isArray(data) ? data : Object.values(data)
      }));
    };

    const handleTyping = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        typingUsers: data.isTyping 
          ? [...prev.typingUsers.filter(id => id !== data.userId), data.userId]
          : prev.typingUsers.filter(id => id !== data.userId)
      }));
    };

    const handleRefetchChatDetails = (data: any) => {
      if (data.chatId === chat._id) {
        loadPinnedMessages();
        loadMembers();
      }
    };

    const handleAddReaction = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === data.messageId
            ? {
                ...msg,
                reactions: [
                  ...msg.reactions.filter(r => !(r.user._id === data.userId && r.emoji === data.emoji)),
                  { user: data.user, emoji: data.emoji, _id: `react_${Date.now()}` }
                ]
              }
            : msg
        )
      }));
    };

    const handleRemoveReaction = (data: any) => {
      if (data.chatId !== chat._id) return;
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === data.messageId
            ? {
                ...msg,
                reactions: msg.reactions.filter(r => !(r.user._id === data.userId && r.emoji === data.emoji))
              }
            : msg
        )
      }));
    };

    // Register event listeners
    socket.on(NEW_MESSAGE, handleNewMessage);
    socket.on(NEW_REACTION, handleNewReaction);
    socket.on(UPDATE_MESSAGE, handleMessageUpdate);
    socket.on(DELETE_MESSAGE, handleMessageDelete);
    socket.on(PIN_MESSAGE, handlePinMessage);
    socket.on(UNPIN_MESSAGE, handleUnpinMessage);
    socket.on(ONLINE_USERS, handleOnlineUsers);
    socket.on(START_TYPING, handleTyping);
    socket.on(STOP_TYPING, handleTyping);
    socket.on(REFETCH_CHAT_DETAILS, handleRefetchChatDetails);
    socket.on('ADD_REACTION', handleAddReaction);
    socket.on('REMOVE_REACTION', handleRemoveReaction);

    return () => {
      socket.off(NEW_MESSAGE, handleNewMessage);
      socket.off(NEW_REACTION, handleNewReaction);
      socket.off(UPDATE_MESSAGE, handleMessageUpdate);
      socket.off(DELETE_MESSAGE, handleMessageDelete);
      socket.off(PIN_MESSAGE, handlePinMessage);
      socket.off(UNPIN_MESSAGE, handleUnpinMessage);
      socket.off(ONLINE_USERS, handleOnlineUsers);
      socket.off(START_TYPING, handleTyping);
      socket.off(STOP_TYPING, handleTyping);
      socket.off(REFETCH_CHAT_DETAILS, handleRefetchChatDetails);
      socket.off('ADD_REACTION', handleAddReaction);
      socket.off('REMOVE_REACTION', handleRemoveReaction);
    };
  }, [socket, chat._id]);

  const loadInitialData = async () => {
    await Promise.all([
      loadMessages(),
      loadPinnedMessages(),
      loadMembers(),
    ]);
  };

  const loadMessages = async () => {
    if (!token) return;
    
    setChatState(prev => ({ ...prev, isLoadingMessages: true }));
    
    try {
      const response = await getChatMessages(chat._id, 1, 50, token);
      console.log('Messages response:', response);
      
      const messages = response.messages || response || [];
      const sortedMessages = Array.isArray(messages) ? messages
        .map(msg => ({ 
          ...msg, 
          id: msg._id,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt)
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
      
      console.log('Sorted messages:', sortedMessages);
      
      setChatState(prev => ({
        ...prev,
        messages: sortedMessages,
        isLoadingMessages: false
      }));
    } catch (error) {
      console.log('Chat API not available, using empty messages list:', error);
      // If API is not available, start with empty messages
      setChatState(prev => ({
        ...prev,
        messages: [],
        isLoadingMessages: false
      }));
    }
  };

  const loadPinnedMessages = async () => {
    if (!token) return;
    
    setChatState(prev => ({ ...prev, isLoadingPinned: true }));
    
    try {
      const response = await getPinnedMessages(chat._id, token);
      console.log('Pinned messages response:', response);
      
      // Handle different response formats
      const pinnedMessages = response.pinnedMessages || response.messages || response || [];
      
      setChatState(prev => ({
        ...prev,
        pinnedMessages: Array.isArray(pinnedMessages) ? pinnedMessages : [],
        isLoadingPinned: false
      }));
    } catch (error) {
      console.log('Pinned messages API not available:', error);
      setChatState(prev => ({
        ...prev,
        pinnedMessages: [],
        isLoadingPinned: false
      }));
    }
  };

  const loadMembers = async () => {
    if (!token) return;
    
    try {
      const response = await getChatMembers(chat._id, token);
      const memberUsers = response.members?.map((m: any) => m.user) || [];
      setMembers(memberUsers);
    } catch (error) {
      console.log('Members API not available, using chat members');
      // Fallback to chat members from props - convert to User format
      const memberUsers = chat.members?.map(m => ({
        _id: m.user._id || m.user.id || '',
        name: m.user.name || '',
        email: m.user.email || '',
        profilePic: m.user.profilePic || '',
        avatar: m.user.profilePic || ''
      })) || [];
      setMembers(memberUsers);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[], replyToId?: string, mentions?: string[]) => {
    if (!token || (!content.trim() && !attachments?.length)) return;
    
    try {
      // Create message object exactly like website
      const message: Message = {
        messageId: `msg${Date.now()}`,
        content: content.trim(),
        sender: {
          _id: actualUser._id || "",
          name: actualUser.name || "",
          email: actualUser.email || "",
          avatar: actualUser.profilePic || "",
          profilePic: actualUser.profilePic || "",
        },
        chat: chat._id,
        readBy: [],
        deletedFor: [],
        reactions: [],
        type: attachments && attachments.length > 0 ? "attachment" : "text",
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: attachments || [],
        _id: `msg${Date.now()}`,
        replyTo: replyToId,
        mentions: mentions?.map(id => {
          const mentionedUser = members.find(m => m._id === id);
          return mentionedUser ? { _id: mentionedUser._id, name: mentionedUser.name } : undefined;
        }).filter(Boolean) as MentionSuggestion[] || [],
      };

      // If replying, find the full replyToMessage object
      if (replyToId) {
        const repliedMessage = chatState.messages.find(msg => msg._id === replyToId);
        if (repliedMessage) {
          message.replyToMessage = repliedMessage;
        }
      }

      // Add to local state immediately (like website)
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }));

      // Update grouped messages (like website)
      const groupKey = getDateGroupKey(new Date());
      setChatState(prev => {
        const newGroups = { ...prev.groupedMessages };
        if (!newGroups[groupKey]) {
          newGroups[groupKey] = [];
        }
        newGroups[groupKey].push(message);
        return {
          ...prev,
          groupedMessages: newGroups
        };
      });

      // Update date groups (like website)
      setChatState(prev => {
        if (!prev.dateGroups.includes(groupKey)) {
          const newOrderedGroups = getOrderedDateGroups({
            ...prev.groupedMessages,
            [groupKey]: [message],
          });
          return {
            ...prev,
            dateGroups: newOrderedGroups.reverse()
          };
        }
        return prev;
      });

      // Emit socket event exactly like website
      socket?.emit(NEW_MESSAGE, {
        chatId: chat._id,
        members: chat.members,
        message,
        messageId: message.messageId,
      });
      
      // Clear reply
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleEditMessage = async (message: Message, newContent: string) => {
    if (!token || !newContent.trim()) return;
    
    try {
      await editMessage(message._id, newContent.trim(), token);
      
      // Emit socket event
      socket?.emit(UPDATE_MESSAGE, {
        chatId: chat._id,
        messageId: message._id,
        message: { content: newContent.trim() }
      });
      
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
      Alert.alert('Error', 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;
    
    // Remove from local state immediately
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg._id !== messageId),
    }));
    
    try {
      await deleteMessage(messageId, token);
      console.log('Message deleted successfully');
      
      // Emit socket event
      socket?.emit(DELETE_MESSAGE, {
        chatId: chat._id,
        messageId
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      
      // Check if message was already deleted
      if (error.message?.includes('Resource not found') || 
          error.message?.includes('Message not found') ||
          error.message?.includes('Message not found or deleted')) {
        console.log('Message was already deleted, removed from local state');
        // Message was already removed from local state, so this is fine
      } else {
        Alert.alert('Error', 'Failed to delete message');
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!token) return;
    
    try {
      const message = chatState.messages.find(m => m._id === messageId);
      const existingReaction = message?.reactions.find(
        r => r.user._id === actualUser._id && r.emoji === emoji
      );
      
      if (existingReaction) {
        await removeReaction(messageId, emoji, token);
      } else {
        await addReaction(messageId, emoji, token);
      }
      
      // Emit socket event
      socket?.emit(existingReaction ? REMOVE_REACTION : ADD_REACTION, {
        messageId,
        chatId: chat._id,
        emoji,
        userId: actualUser._id
      });
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!token) return;
    
    try {
      await pinMessage(messageId, token);
      
      // Emit socket event
      socket?.emit(PIN_MESSAGE, {
        messageId,
        chatId: chat._id
      });
      
      loadPinnedMessages();
    } catch (error) {
      console.error('Failed to pin message:', error);
      Alert.alert('Error', 'Failed to pin message');
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    if (!token) return;
    
    try {
      await unpinMessage(messageId, token);
      
      // Emit socket event
      socket?.emit(UNPIN_MESSAGE, {
        messageId,
        chatId: chat._id
      });
    } catch (error) {
      console.error('Failed to unpin message:', error);
      Alert.alert('Error', 'Failed to unpin message');
    }
  };

  const handleSearch = async (query: string) => {
    if (!token || !query.trim()) {
      setChatState(prev => ({ ...prev, searchResults: null, isSearching: false }));
        return;
      }
      
    setChatState(prev => ({ ...prev, isSearching: true }));
    
    try {
      const results = await searchMessages(chat._id, query, 1, 20, token);
      setChatState(prev => ({ ...prev, searchResults: results, isSearching: false }));
    } catch (error) {
      console.error('Search failed:', error);
      setChatState(prev => ({ ...prev, isSearching: false }));
      Alert.alert('Error', 'Failed to search messages');
    }
  };

  const handleClearSearch = () => {
    setChatState(prev => ({ ...prev, searchResults: null, isSearching: false }));
  };

  const handleSearchMessage = (message: Message) => {
    // Find the message in the current messages and scroll to it
    const messageIndex = chatState.messages.findIndex(msg => msg._id === message._id);
    if (messageIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: messageIndex, animated: true });
    }
    setShowSearch(false);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      socket?.emit(START_TYPING, { chatId: chat._id });
        } else {
      socket?.emit(STOP_TYPING, { chatId: chat._id });
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
      <MessageBubble
        message={item}
        isCurrentUser={item.sender._id === actualUser._id}
        currentUser={actualUser}
      onReply={handleReply}
      onEdit={handleEdit}
      onDelete={handleDeleteMessage}
      onPin={handlePinMessage}
      onUnpin={handleUnpinMessage}
    />
  );

  const renderTypingIndicator = () => {
    // Convert typing user IDs to User objects
    const typingUsers = chatState.typingUsers.map(userId => 
      members.find(member => member._id === userId) || 
      { _id: userId, name: 'Someone', email: '', avatar: '' }
    ).filter(Boolean) as User[];
    
    return <TypingIndicator users={typingUsers} />;
  };

  if (chatState.isLoadingMessages) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      enabled={true}
    >
      <ChatHeader
        chat={chat}
        currentUser={actualUser}
        onlineUsers={chatState.onlineUsers}
        onBack={onBack}
        onTogglePinned={() => setShowPinnedMessages(true)}
        onSearch={() => setShowSearch(true)}
        onSearchResults={(results) => setChatState(prev => ({ ...prev, searchResults: results }))}
        onClearSearch={handleClearSearch}
        isSearching={chatState.isSearching}
        searchResults={chatState.searchResults}
      />
      
      {chatState.pinnedMessages.length > 0 && (
        <PinnedMessagesHeader
          pinnedMessages={chatState.pinnedMessages}
          onClose={() => setShowPinnedMessages(false)}
          onMessagePress={(message) => {
            // Scroll to message
            const messageIndex = chatState.messages.findIndex(msg => msg._id === message._id);
            if (messageIndex !== -1 && flatListRef.current) {
              flatListRef.current.scrollToIndex({ index: messageIndex, animated: true });
            }
          }}
          currentUser={actualUser}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={chatState.searchResults ? chatState.searchResults.messages : chatState.messages}
        keyExtractor={(item, index) => item._id || `message_${index}`}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListFooterComponent={renderTypingIndicator}
        showsVerticalScrollIndicator={false}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        editingMessage={editingMessage}
        onCancelEdit={handleCancelEdit}
        chatId={chat._id}
        members={members}
      />

      {showPinnedMessages && (
        <PinnedMessages
          chatId={chat._id}
          currentUser={actualUser}
          onClose={() => setShowPinnedMessages(false)}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDeleteMessage}
        />
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <MessageSearch
          chatId={chat._id}
          onClose={() => setShowSearch(false)}
          onSelectMessage={handleSearchMessage}
          token={token || ''}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  typingIndicator: {
    padding: 12,
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ChatWindow;