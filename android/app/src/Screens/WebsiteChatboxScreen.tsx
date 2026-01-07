import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { useSocket } from '../Context/SocketContext';
import useAxios from '../hooks/useAxios';
import { Chat, Message, User } from '../types/chattypes';
import { 
  getChatMessages, 
  addReaction, 
  removeReaction, 
  editMessage, 
  deleteMessage, 
  pinMessage, 
  unpinMessage,
  forwardMessage,
} from '../Services/api';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  NEW_MESSAGE,
  START_TYPING,
  STOP_TYPING,
  CHAT_JOINED,
  CHAT_LEAVED,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  NEW_REACTION,
  PIN_MESSAGE,
  UNPIN_MESSAGE,
} from '../constants/events';

// Helper function to format date/time
const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older dates, show actual date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const { width, height } = Dimensions.get('window');

interface WebsiteChatboxScreenProps {}

const WebsiteChatboxScreen: React.FC<WebsiteChatboxScreenProps> = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const { socket, isConnected } = useSocket();
  const { currentUser, token } = useSelector((state: RootState) => state.user);
  
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const recentMessagesRef = useRef<Set<string>>(new Set());
  const isFetchingChatsRef = useRef(false);
  const hasFetchedChatsRef = useRef(false);
  const fetchChatsRef = useRef<() => Promise<void>>();
  const fetchChatsTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    if (!token) return;
    
    // Prevent multiple simultaneous calls
    if (isFetchingChatsRef.current) {
      console.log('⏸️ Already fetching chats, skipping...');
      return;
    }
    
    isFetchingChatsRef.current = true;
    setLoadingChats(true);
    try {
      const response = await callApi({
        method: 'GET',
        url: '/chats/my-chats',
      });
      
      const chatsData = response?.data?.chats || response?.chats || response || [];
      const sortedChats = Array.isArray(chatsData)
        ? chatsData.sort((a: Chat, b: Chat) => {
            const aTime = a.lastMessage?.createdAt 
              ? new Date(a.lastMessage.createdAt).getTime() 
              : new Date(a.updatedAt || a.createdAt).getTime();
            const bTime = b.lastMessage?.createdAt 
              ? new Date(b.lastMessage.createdAt).getTime() 
              : new Date(b.updatedAt || b.createdAt).getTime();
            return bTime - aTime;
          })
        : [];
      
      setChats(sortedChats);
      hasFetchedChatsRef.current = true;
      console.log('✅ Fetched chats:', sortedChats.length);
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error);
      Alert.alert('Error', 'Failed to load chats. Please try again.');
    } finally {
      setLoadingChats(false);
      isFetchingChatsRef.current = false;
    }
  }, [callApi, token]);
  
  // Store latest fetchChats in ref
  useEffect(() => {
    fetchChatsRef.current = fetchChats;
  }, [fetchChats]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId: string, page: number = 1, append: boolean = false) => {
    if (!token || !chatId) return;
    
    if (!append) {
      setLoadingMessages(true);
      setMessages([]);
    }
    
    try {
      const limit = 30;
      const response = await getChatMessages(chatId, page, limit, token);
      
      const messagesData = response?.messages || response?.data?.messages || response || [];
      const sortedMessages = Array.isArray(messagesData)
        ? messagesData
            .map((msg: any) => ({
              ...msg,
              id: msg._id || msg.id,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
              updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
            }))
            .sort((a: Message, b: Message) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        : [];
      
      if (append) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const newMessages = sortedMessages.filter((m: Message) => !existingIds.has(m._id));
          return [...newMessages, ...prev];
        });
      } else {
        setMessages(sortedMessages);
        // Scroll to bottom after initial load
        setTimeout(() => {
          messagesEndRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
      
      setHasMoreMessages(sortedMessages.length === limit);
      setCurrentPage(page);
      console.log('✅ Fetched messages:', sortedMessages.length, 'Page:', page);
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  // Send message with attachments, replies, mentions
  const handleSendMessage = useCallback(async (
    content: string,
    attachments: any[] = [],
    replyToId?: string,
    mentions?: string[]
  ) => {
    if (!selectedChat || (!content.trim() && attachments.length === 0) || sending || !token) return;
    
    setSending(true);
    
    // Optimistic update
    const tempMessage: Message = {
      _id: `temp_${Date.now()}`,
      content: content.trim(),
      sender: {
        _id: currentUser?._id || '',
        name: currentUser?.name || 'You',
        email: currentUser?.email || '',
        avatar: currentUser?.profilePic || currentUser?.avatar,
      },
      chat: selectedChat._id,
      readBy: [],
      deletedFor: [],
      reactions: [],
      type: attachments.length > 0 ? 'attachment' : 'text',
      attachments: attachments || [],
      replyTo: replyToId,
      mentions: mentions?.map(id => {
        const member = selectedChat.members?.find(m => (m.id || m._id) === id);
        return { _id: id, name: member?.name || '' };
      }) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Emit socket event for real-time update
    if (socket) {
      socket.emit(NEW_MESSAGE, {
        chatId: selectedChat._id,
        members: selectedChat.members || [],
        message: tempMessage,
        messageId: tempMessage._id,
      });
    }
    
    try {
      // Use callApi to send message
      const response = await callApi({
        method: 'POST',
        url: '/chats/send',
        data: {
          chatId: selectedChat._id,
          content: content.trim(),
          type: attachments.length > 0 ? 'attachment' : 'text',
          attachments: attachments || [],
          replyTo: replyToId,
          mentions: mentions || [],
        },
      });
      
      // Replace temp message with real message
      const realMessage = response?.message || response?.data?.message || response?.data || response;
      if (realMessage && realMessage._id) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === tempMessage._id
              ? {
                  ...realMessage,
                  id: realMessage._id || realMessage.id,
                  _id: realMessage._id || realMessage.id,
                  createdAt: realMessage.createdAt ? new Date(realMessage.createdAt) : new Date(),
                  updatedAt: realMessage.updatedAt ? new Date(realMessage.updatedAt) : new Date(),
                }
              : msg
          )
        );
      }
      
      // Clear reply and edit states
      setReplyToMessage(null);
      setEditingMessage(null);
      
      // Refresh chats to update last message (debounced)
      if (fetchChatsTimeoutRef.current) {
        clearTimeout(fetchChatsTimeoutRef.current);
      }
      fetchChatsTimeoutRef.current = setTimeout(() => {
        if (fetchChatsRef.current && !isFetchingChatsRef.current) {
          fetchChatsRef.current();
        }
      }, 1000);
    } catch (error: any) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to send message. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSending(false);
    }
  }, [selectedChat, sending, token, currentUser, socket]);

  // Handle typing indicator
  const handleTyping = useCallback((text: string) => {
    if (!selectedChat || !socket) return;
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit(START_TYPING, { chatId: selectedChat._id });
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      socket.emit(STOP_TYPING, { chatId: selectedChat._id });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket?.emit(STOP_TYPING, { chatId: selectedChat?._id });
      }
    }, 3000);
  }, [selectedChat, socket, isTyping]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handleNewMessage = (data: any) => {
      // Only process if it's for the current chat
      if (data?.chatId !== selectedChat._id) return;
      
      // Prevent duplicate messages
      const messageId = data?.message?._id || data?._id;
      if (!messageId || recentMessagesRef.current.has(messageId)) {
        return;
      }
      
      recentMessagesRef.current.add(messageId);
      setTimeout(() => {
        recentMessagesRef.current.delete(messageId);
      }, 5000);
      
      const newMessage: Message = {
        ...(data.message || data),
        id: messageId || data.message?._id || data._id,
        _id: messageId || data.message?._id || data._id,
        createdAt: (data.message?.createdAt || data.createdAt) 
          ? new Date(data.message.createdAt || data.createdAt) 
          : new Date(),
        updatedAt: (data.message?.updatedAt || data.updatedAt) 
          ? new Date(data.message.updatedAt || data.updatedAt) 
          : new Date(),
      };
      
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Refresh chats to update last message (debounced)
      if (fetchChatsTimeoutRef.current) {
        clearTimeout(fetchChatsTimeoutRef.current);
      }
      fetchChatsTimeoutRef.current = setTimeout(() => {
        if (fetchChatsRef.current && !isFetchingChatsRef.current) {
          fetchChatsRef.current();
        }
      }, 1000);
    };

    const handleMessageUpdate = (data: any) => {
      if (data?.chatId === selectedChat._id && data?.messageId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId ? { ...msg, ...data.message } : msg
          )
        );
      }
    };

    const handleMessageDelete = (data: any) => {
      if (data?.chatId === selectedChat._id && data?.messageId) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    const handleNewReaction = (data: any) => {
      if (data?.chatId === selectedChat._id && data?.messageId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId
              ? { ...msg, reactions: data.reactions || [] }
              : msg
          )
        );
      }
    };

    const handlePinMessage = (data: any) => {
      if (data?.chatId === selectedChat._id && data?.messageId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId
              ? { ...msg, pinned: true, isPinned: true }
              : msg
          )
        );
      }
    };

    const handleUnpinMessage = (data: any) => {
      if (data?.chatId === selectedChat._id && data?.messageId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId
              ? { ...msg, pinned: false, isPinned: false }
              : msg
          )
        );
      }
    };

    const handleStartTyping = (data: any) => {
      if (data?.chatId === selectedChat._id && data?.userId !== currentUser?._id) {
        setTypingUsers(prev => 
          prev.includes(data.userId) ? prev : [...prev, data.userId]
        );
      }
    };
    
    const handleStopTyping = (data: any) => {
      if (data?.chatId === selectedChat._id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };
    
    socket.on(NEW_MESSAGE, handleNewMessage);
    socket.on(START_TYPING, handleStartTyping);
    socket.on(STOP_TYPING, handleStopTyping);
    socket.on(UPDATE_MESSAGE, handleMessageUpdate);
    socket.on(DELETE_MESSAGE, handleMessageDelete);
    socket.on(NEW_REACTION, handleNewReaction);
    socket.on(PIN_MESSAGE, handlePinMessage);
    socket.on(UNPIN_MESSAGE, handleUnpinMessage);

    // Join chat room
    socket.emit(CHAT_JOINED, { chatId: selectedChat._id });

    return () => {
      socket.off(NEW_MESSAGE, handleNewMessage);
      socket.off(START_TYPING, handleStartTyping);
      socket.off(STOP_TYPING, handleStopTyping);
      socket.off(UPDATE_MESSAGE, handleMessageUpdate);
      socket.off(DELETE_MESSAGE, handleMessageDelete);
      socket.off(NEW_REACTION, handleNewReaction);
      socket.off(PIN_MESSAGE, handlePinMessage);
      socket.off(UNPIN_MESSAGE, handleUnpinMessage);
      socket.emit(CHAT_LEAVED, { chatId: selectedChat._id });
      if (fetchChatsTimeoutRef.current) {
        clearTimeout(fetchChatsTimeoutRef.current);
      }
    };
  }, [socket, selectedChat, currentUser]); // Removed fetchChats from dependencies

  // Load chats on mount (only once)
  useEffect(() => {
    if (!hasFetchedChatsRef.current && token) {
      fetchChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only depend on token, not fetchChats

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id, 1, false);
    } else {
      setMessages([]);
    }
  }, [selectedChat, fetchMessages]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (fetchChatsTimeoutRef.current) {
        clearTimeout(fetchChatsTimeoutRef.current);
      }
    };
  }, []);

  // Render chat list item
  const renderChatItem = ({ item }: { item: Chat }) => {
    const isSelected = selectedChat?._id === item._id;
    const otherMember = item.members?.find(
      (m: any) => (m.user?._id || m._id) !== currentUser?._id
    );
    const chatName = item.name || otherMember?.user?.name || otherMember?.name || 'Unknown';
    const chatAvatar = item.avatar || otherMember?.user?.profilePic || otherMember?.profilePic || otherMember?.user?.avatar || otherMember?.avatar;
    const lastMessage = item.lastMessage;
    const unreadCount = item.unreadCount || 0;
    
    return (
      <TouchableOpacity
        style={[styles.chatItem, isSelected && styles.chatItemSelected]}
        onPress={() => setSelectedChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.chatItemAvatar}>
          {chatAvatar ? (
            <Image source={{ uri: chatAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{chatName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chatItemContent}>
          <View style={styles.chatItemHeader}>
            <Text style={styles.chatItemName} numberOfLines={1}>
              {chatName}
            </Text>
            {lastMessage && (
              <Text style={styles.chatItemTime}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>
          {lastMessage && (
            <Text style={styles.chatItemPreview} numberOfLines={1}>
              {lastMessage.content || 'Attachment'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Handlers for advanced features
  const handleReply = useCallback((message: Message) => {
    setReplyToMessage(message);
  }, []);

  const handleEdit = useCallback((message: Message) => {
    setEditingMessage(message);
    setMessageText(message.content || '');
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    if (!token) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(messageId, token);
              setMessages(prev => prev.filter(msg => msg._id !== messageId));
              if (socket) {
                socket.emit(DELETE_MESSAGE, {
                  messageId,
                  chatId: selectedChat?._id,
                });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  }, [token, socket, selectedChat]);

  const handlePin = useCallback(async (messageId: string) => {
    if (!token) return;
    
    try {
      await pinMessage(messageId, token);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, pinned: true, isPinned: true } : msg
        )
      );
      if (socket) {
        socket.emit(PIN_MESSAGE, {
          messageId,
          chatId: selectedChat?._id,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pin message');
    }
  }, [token, socket, selectedChat]);

  const handleUnpin = useCallback(async (messageId: string) => {
    if (!token) return;
    
    try {
      await unpinMessage(messageId, token);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, pinned: false, isPinned: false } : msg
        )
      );
      if (socket) {
        socket.emit(UNPIN_MESSAGE, {
          messageId,
          chatId: selectedChat?._id,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unpin message');
    }
  }, [token, socket, selectedChat]);

  const handleForward = useCallback((message: Message) => {
    Alert.alert('Forward Message', 'Forward functionality coming soon');
  }, []);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!token) return;
    
    try {
      const message = messages.find(m => m._id === messageId);
      const hasReaction = message?.reactions?.some(
        r => r.user._id === currentUser?._id && r.emoji === emoji
      );
      
      if (hasReaction) {
        await removeReaction(messageId, emoji, token);
      } else {
        await addReaction(messageId, emoji, token);
      }
      
      // Update local state
      setMessages(prev =>
        prev.map(msg => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            if (hasReaction) {
              return {
                ...msg,
                reactions: reactions.filter(
                  r => !(r.user._id === currentUser?._id && r.emoji === emoji)
                ),
              };
            } else {
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  { user: currentUser as User, emoji },
                ],
              };
            }
          }
          return msg;
        })
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update reaction');
    }
  }, [token, messages, currentUser]);

  // Render message item using MessageBubble component
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender?._id === currentUser?._id;
    
    return (
      <MessageBubble
        message={item}
        isCurrentUser={isMyMessage}
        currentUser={currentUser as User}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onForward={handleForward}
        showReactions={true}
        showPinIcon={true}
        allChatMessages={messages}
        chatMembers={selectedChat?.members?.map(m => ({
          _id: m.id || m._id,
          name: m.name,
          email: m.email || '',
          avatar: m.profilePic || '',
        })) || []}
        isGroupChat={selectedChat?.isGroup || false}
        searchTerm={searchTerm}
        isHighlighted={highlightedMessageId === item._id}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Website Chatbox</Text>
        <View style={styles.headerRight}>
          {!isConnected && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline-outline" size={20} color="#F44336" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {!selectedChat ? (
          /* Chat List - Full Width */
          <View style={styles.chatListContainerFull}>
            <View style={styles.chatListHeader}>
              <Text style={styles.chatListTitle}>Chats</Text>
              <TouchableOpacity
                onPress={fetchChats}
                style={styles.refreshButton}
              >
                <Ionicons name="refresh" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            
            {loadingChats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            ) : (
              <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
                    <Text style={styles.emptyText}>No chats yet</Text>
                    <Text style={styles.emptySubtext}>Start a conversation!</Text>
                  </View>
                }
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      if (fetchChatsRef.current) {
                        fetchChatsRef.current().finally(() => setRefreshing(false));
                      } else {
                        setRefreshing(false);
                      }
                    }}
                    colors={['#FF6B35']}
                  />
                }
              />
            )}
          </View>
        ) : (
          /* Chat Window - Full Screen */
          <View style={styles.messagesContainerFull}>
            {/* Chat Header with Back Button */}
            <View style={styles.chatHeader}>
              <TouchableOpacity
                style={styles.backButtonHeader}
                onPress={() => setSelectedChat(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <View style={styles.chatHeaderInfo}>
                {selectedChat.avatar ? (
                  <Image
                    source={{ uri: selectedChat.avatar }}
                    style={styles.chatHeaderAvatar}
                  />
                ) : (
                  <View style={styles.chatHeaderAvatarPlaceholder}>
                    <Text style={styles.chatHeaderAvatarText}>
                      {(selectedChat.name || 'Chat').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.chatHeaderName}>
                    {selectedChat.name || 'Chat'}
                  </Text>
                  {typingUsers.length > 0 && (
                    <Text style={styles.typingIndicator}>typing...</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Messages List */}
            {loadingMessages && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            ) : (
              <FlatList
                ref={messagesEndRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                contentContainerStyle={styles.messagesList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubtext}>Start the conversation!</Text>
                  </View>
                }
                onEndReached={() => {
                  if (hasMoreMessages && !loadingMessages) {
                    fetchMessages(selectedChat._id, currentPage + 1, true);
                  }
                }}
                onEndReachedThreshold={0.5}
              />
            )}

            {/* Message Input with advanced features */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={(isTyping) => {
                if (isTyping && socket && selectedChat) {
                  socket.emit(START_TYPING, { chatId: selectedChat._id });
                } else if (socket && selectedChat) {
                  socket.emit(STOP_TYPING, { chatId: selectedChat._id });
                }
              }}
              replyTo={replyToMessage}
              onCancelReply={() => setReplyToMessage(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => {
                setEditingMessage(null);
                setMessageText('');
              }}
              chatId={selectedChat._id}
              members={selectedChat.members?.map(m => ({
                _id: m.id || m._id,
                name: m.name,
                email: m.email || '',
                avatar: m.profilePic || '',
              })) || []}
              disabled={sending}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  offlineIndicator: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  chatListContainerFull: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  chatListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  chatItemAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatItemTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatItemPreview: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainerFull: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonHeader: {
    padding: 8,
    marginRight: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageSenderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    fontSize: 15,
    color: '#333',
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
});

export default WebsiteChatboxScreen;

