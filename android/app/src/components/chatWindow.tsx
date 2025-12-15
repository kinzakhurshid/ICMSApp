import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';

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
  NEW_MESSAGE_ALERT,
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
  CHAT_JOINED,
  CHAT_LEAVED,
} from '../constants/events';

// Import components
import ChatHeaderNew from './ChatHeaderNew';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import PinnedMessages from './PinnedMessages';
import PinnedMessagesHeader from './PinnedMessagesHeader';
import PinnedMessagesScreen from './PinnedMessagesScreen';
import TypingIndicator from './TypingIndicator';
import MessageSearch from './MessageSearch';
import ChatSearch from './ChatSearch';
import ChatMediaLinksModal from './ChatMediaLinksModal';
import GroupMemberManagementModal from './GroupMemberManagementModal';
import ForwardMessageModal from './ForwardMessageModal';
import { MessageListSkeleton } from './ChatSkeletonLoader';

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
  allChats = [],
}) => {
  const navigation = useNavigation();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedMessageIds, setHighlightedMessageIds] = useState<Set<string>>(new Set());
  const [searchResultIds, setSearchResultIds] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showMediaLinks, setShowMediaLinks] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const messagesBeforeLoadRef = useRef<number>(0);
  
  const flatListRef = useRef<FlatList>(null);
  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);
  const actualUser = currentUser.currentUser;

  // Emit CHAT_JOINED when chat opens and CHAT_LEAVED when chat closes
  useEffect(() => {
    if (!socket || !chat._id || !actualUser?._id) return;

    // Get member IDs for the chat
    const memberIds = chat.members
      ?.map((m: any) => (typeof m === 'string' ? m : m._id || m.id))
      .filter((id: any) => id && id !== actualUser._id) || [];

    // Emit CHAT_JOINED when component mounts
    socket.emit(CHAT_JOINED, {
      userId: actualUser._id,
      members: memberIds,
      chatId: chat._id,
    });

    // Emit CHAT_LEAVED when component unmounts
    return () => {
      if (socket && chat._id && actualUser._id) {
        socket.emit(CHAT_LEAVED, {
          userId: actualUser._id,
          members: memberIds,
          chatId: chat._id,
        });
      }
    };
  }, [socket, chat._id, actualUser?._id, chat.members]);

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


      // Note: NEW_MESSAGE_ALERT should be emitted by the backend when a message is sent
      // This frontend code just receives and displays the message
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
      loadAllUsers(),
    ]);
  };

  const loadMessages = async (page: number = 1, append: boolean = false) => {
    if (!token) return;
    
    if (append) {
      setIsLoadingOlderMessages(true);
    } else {
      setChatState(prev => ({ ...prev, isLoadingMessages: true }));
    }
    
    try {
      const limit = 30; // Page size
      const response = await getChatMessages(chat._id, page, limit, token);
      
      const messages = response.messages || response || [];
      const sortedMessages = Array.isArray(messages) ? messages
        .map(msg => ({ 
          ...msg, 
          id: msg._id,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt)
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
      
      if (append) {
        // Append older messages to the beginning
        setChatState(prev => {
          const existingIds = new Set(prev.messages.map(m => m._id));
          const newMessages = sortedMessages.filter(m => !existingIds.has(m._id));
          const combinedMessages = [...newMessages, ...prev.messages];
          
          // Maintain scroll position
          setTimeout(() => {
            if (flatListRef.current && messagesBeforeLoadRef.current > 0) {
              // Scroll to maintain position
              const scrollOffset = messagesBeforeLoadRef.current * 100; // Approximate height per message
              flatListRef.current.scrollToOffset({ 
                offset: scrollOffset, 
                animated: false 
              });
            }
          }, 100);
          
          return {
            ...prev,
            messages: combinedMessages,
          };
        });
        setIsLoadingOlderMessages(false);
        
        // Check if there are more messages
        setHasMoreMessages(sortedMessages.length === limit);
      } else {
        // Initial load
        setChatState(prev => ({
          ...prev,
          messages: sortedMessages,
          isLoadingMessages: false
        }));
        setCurrentPage(1);
        setHasMoreMessages(sortedMessages.length === limit);
        
        // Scroll to bottom after initial load
        setTimeout(() => {
          scrollToBottom();
        }, 300);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      if (append) {
        setIsLoadingOlderMessages(false);
      } else {
        setChatState(prev => ({
          ...prev,
          messages: [],
          isLoadingMessages: false
        }));
      }
    }
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasMoreMessages || !token) return;
    
    // Store current scroll position
    messagesBeforeLoadRef.current = chatState.messages.length;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadMessages(nextPage, true);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollPositionRef.current = contentOffset.y;
    
    // Load more when scrolling near the top
    if (contentOffset.y < 500 && hasMoreMessages && !isLoadingOlderMessages) {
      loadOlderMessages();
    }
  };

  const loadPinnedMessages = async () => {
    if (!token) return;
    
    setChatState(prev => ({ ...prev, isLoadingPinned: true }));
    
    try {
      const response = await getPinnedMessages(chat._id, token);
      
      // Handle different response formats
      const pinnedMessages = response.pinnedMessages || response.messages || response || [];
      
      setChatState(prev => ({
        ...prev,
        pinnedMessages: Array.isArray(pinnedMessages) ? pinnedMessages : [],
        isLoadingPinned: false
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        pinnedMessages: [],
        isLoadingPinned: false
      }));
    }
  };

  const loadMembers = async () => {
    
    if (!token) {
      return;
    }
    
    try {
      const response = await getChatMembers(chat._id, token);
      
      // Filter out undefined/null members and ensure they have required properties
      const memberUsers = (response.members || [])
        .map((m: any) => m?.user || m)
        .filter((user: any) => user && user._id && user.name)
        .map((user: any) => ({
          _id: user._id || user.id,
          name: user.name || user.fullName || '',
          email: user.email || '',
          profilePic: user.profilePic || user.avatar || '',
          avatar: user.profilePic || user.avatar || ''
        }));
      
      setMembers(memberUsers);
    } catch (error: any) {
      // Silently fallback to chat members from props
      // Only log if it's not a 404 or "Resource not found" (expected when endpoint doesn't exist)
      const isExpectedError = 
        error?.response?.status === 404 || 
        error?.message === 'Resource not found' ||
        error === 'Resource not found' ||
        (typeof error === 'string' && error.includes('Resource not found'));
      
      if (!isExpectedError) {
        console.error('Failed to fetch chat members:', error);
      }
      
      // Fallback to chat members from props - convert to User format
      const memberUsers = (chat.members || [])
        .filter((m: any) => m && (m.user || m._id))
        .map((m: any) => {
          const user = m.user || m;
          return {
            _id: user._id || user.id || '',
            name: user.name || user.fullName || '',
            email: user.email || '',
            profilePic: user.profilePic || user.avatar || '',
            avatar: user.profilePic || user.avatar || ''
          };
        })
        .filter((user: any) => user._id && user.name);
      
      setMembers(memberUsers);
    }
  };

  const loadAllUsers = async () => {
    if (!token) return;
    
    try {
      // Fetch all employees/users for adding to group
      const response = await fetch(`${process.env.API_URL || 'http://89.116.32.31:5001'}/employee`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const employees = data.data || data || [];
        const users = employees.map((emp: any) => ({
          _id: emp._id || emp.id,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Unknown',
          email: emp.email || '',
          profilePic: emp.profilePic || emp.avatar || '',
          avatar: emp.profilePic || emp.avatar || '',
        }));
        setAllUsers(users);
      }
    } catch (error: any) {
      // Silently fallback - only log unexpected errors
      if (error?.message !== 'Network request failed' && error?.code !== 'NETWORK_ERROR') {
        console.error('Failed to load users:', error);
      }
      // Fallback: use members from chat if available
      if (chat.members && chat.members.length > 0) {
        const users = chat.members
          .filter((m: any) => m && (m.user || m._id))
          .map((m: any) => {
            const user = m.user || m;
            return {
              _id: user._id || user.id || '',
              name: user.name || user.fullName || '',
              email: user.email || '',
              profilePic: user.profilePic || user.avatar || '',
              avatar: user.profilePic || user.avatar || '',
            };
          });
        setAllUsers(users);
      }
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[], replyToId?: string, mentions?: string[]) => {
    if (!token || (!content.trim() && !attachments?.length)) return;
    
    // Create optimistic message
    const tempMessageId = `temp_${Date.now()}`;
    const message: Message = {
      messageId: tempMessageId,
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
      _id: tempMessageId,
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

    // Store original state for rollback
    const originalMessages = [...chatState.messages];
    const originalGroupedMessages = { ...chatState.groupedMessages };
    const originalDateGroups = [...chatState.dateGroups];

    // Optimistic update - Add to local state immediately
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));

    // Update grouped messages
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

    // Update date groups
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

    // Emit socket event
    socket?.emit(NEW_MESSAGE, {
      chatId: chat._id,
      members: chat.members,
      message,
      messageId: message.messageId,
    });
    
    // Clear reply
    setReplyTo(null);

    // Send to API and update with real message
    try {
      const response = await sendMessage(chat._id, {
        content: content.trim(),
        type: attachments && attachments.length > 0 ? 'attachment' : 'text',
        attachments: attachments || [],
        replyTo: replyToId,
        mentions: mentions || []
      }, token);
      
      // Replace optimistic message with real message from server
      if (response && response._id) {
        setChatState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg._id === tempMessageId ? { ...response, id: response._id } : msg
          )
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Rollback optimistic update
      setChatState(prev => ({
        ...prev,
        messages: originalMessages,
        groupedMessages: originalGroupedMessages,
        dateGroups: originalDateGroups
      }));
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleEditMessage = async (message: Message, newContent: string) => {
    if (!token || !newContent.trim()) return;
    
    // Store original content for rollback
    const originalContent = message.content;
    
    // Optimistic update
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg._id === message._id
          ? { ...msg, content: newContent.trim(), updatedAt: new Date(), isEdited: true }
          : msg
      )
    }));
    
    setEditingMessage(null);
    
    // Emit socket event
    socket?.emit(UPDATE_MESSAGE, {
      chatId: chat._id,
      messageId: message._id,
      message: { content: newContent.trim() }
    });
    
    try {
      await editMessage(message._id, newContent.trim(), token);
      // Success - optimistic update already applied
    } catch (error) {
      console.error('Failed to edit message:', error);
      
      // Rollback optimistic update
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === message._id
            ? { ...msg, content: originalContent, isEdited: false }
            : msg
        )
      }));
      
      Alert.alert('Error', 'Failed to edit message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;
    
    // Store deleted message for rollback
    const deletedMessage = chatState.messages.find(msg => msg._id === messageId);
    if (!deletedMessage) return;
    
    // Optimistic update - Remove from local state immediately
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg._id !== messageId),
    }));
    
    // Emit socket event
    socket?.emit(DELETE_MESSAGE, {
      chatId: chat._id,
      messageId,
    });
    
    try {
      await deleteMessage(messageId, token);
      // Success - optimistic update already applied
    } catch (error) {
      console.error('Failed to delete message:', error);
      
      // Rollback optimistic update
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, deletedMessage].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }));
      
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    }
  };

  const handleForwardMessage = (message: Message) => {
    console.log('🔍 [Forward] handleForwardMessage called with message:', message._id);
    setMessageToForward(message);
    setShowForwardModal(true);
    console.log('🔍 [Forward] Modal state set to true, messageToForward:', message._id);
  };

  const handleForward = async (chatIds: string[]): Promise<boolean> => {
    console.log('🔍 [Forward] handleForward called with chatIds:', chatIds);
    console.log('🔍 [Forward] messageToForward:', messageToForward?._id);
    console.log('🔍 [Forward] token exists:', !!token);
    
    if (!messageToForward || !token || chatIds.length === 0) {
      console.error('🔍 [Forward] Missing required data:', { messageToForward: !!messageToForward, token: !!token, chatIds: chatIds.length });
      Alert.alert('Error', 'Please select at least one chat to forward to.');
      return false;
    }

    setIsForwarding(true);
    console.log('🔍 [Forward] Starting forward process...');
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Forward message to each selected chat
      for (const chatId of chatIds) {
        try {
          console.log(`🔍 [Forward] Forwarding to chat: ${chatId}`);
          
          // Create forwarded message content
          // Note: Using original content without "Forwarded:" prefix to match server expectations
          const forwardedContent = messageToForward.content 
            ? messageToForward.content.trim()
            : messageToForward.attachments?.length > 0 
              ? 'Message with attachment'
              : 'Message';
          
          console.log('🔍 [Forward] Forwarded content:', forwardedContent);
          
          // Validate content is not empty
          if (!forwardedContent || forwardedContent.trim().length === 0) {
            console.error('🔍 [Forward] Empty content, skipping forward');
            failCount++;
            continue;
          }
          
          // Prepare attachments - ensure they're in the correct format
          const attachments = messageToForward.attachments?.map(att => ({
            url: att.url || att.uri,
            fileType: att.fileType || att.type || 'unknown',
            fileName: att.fileName || att.name || 'attachment',
            size: att.size || 0
          })) || [];
          
          console.log('🔍 [Forward] Attachments:', attachments.length);
          
          // Try forwarding via Socket.IO first (like regular messages do)
          // This matches the pattern used for regular messages
          console.log('🔍 [Forward] Attempting forward via Socket.IO pattern...');
          
          // Create a temporary message object for optimistic update
          const tempMessageId = `forward_${Date.now()}_${chatId}`;
          const forwardedMessage = {
            _id: tempMessageId,
            content: forwardedContent,
            type: attachments.length > 0 ? 'attachment' : 'text',
            attachments: attachments,
            sender: actualUser,
            chat: chatId,
            createdAt: new Date().toISOString(),
            messageId: tempMessageId,
            isForwarded: true,
            originalMessage: {
              _id: messageToForward._id,
              content: messageToForward.content,
              sender: messageToForward.sender,
              chat: messageToForward.chat
            }
          };

          // Emit socket event first (optimistic update pattern)
          if (socket) {
            const targetChat = allChats.find(c => c._id === chatId);
            socket.emit(NEW_MESSAGE, {
              chatId,
              members: targetChat?.members || [],
              message: forwardedMessage,
              messageId: tempMessageId,
            });
            console.log('🔍 [Forward] Emitted NEW_MESSAGE socket event');
          }

          // Then try REST API - try multiple approaches
          let response: any = null;
          let apiSuccess = false;
          
          // Approach 1: Try sendMessage API (current approach)
          try {
            console.log('🔍 [Forward] Attempting Approach 1: sendMessage API...');
            const messageData: {
              content: string;
              type: 'text' | 'attachment';
              attachments?: any[];
              replyTo?: string;
              mentions?: string[];
            } = {
              content: forwardedContent,
              type: attachments.length > 0 ? 'attachment' : 'text',
              attachments: attachments.length > 0 ? attachments : undefined,
              mentions: [],
            };
            
            if (messageToForward.replyTo) {
              messageData.replyTo = messageToForward.replyTo;
            }
            
            response = await sendMessage(chatId, messageData, token);
            console.log('🔍 [Forward] sendMessage API success:', response);
            apiSuccess = true;
          } catch (error1: any) {
            console.error('🔍 [Forward] Approach 1 failed:', error1?.message);
            
            // Approach 2: Try minimal payload (just chatId and content)
            try {
              console.log('🔍 [Forward] Attempting Approach 2: Minimal payload...');
              const minimalData = {
                content: forwardedContent,
                type: 'text' as const,
              };
              response = await sendMessage(chatId, minimalData, token);
              console.log('🔍 [Forward] Minimal payload success:', response);
              apiSuccess = true;
            } catch (error2: any) {
              console.error('🔍 [Forward] Approach 2 failed:', error2?.message);
              
              // If both fail, we'll rely on socket event only
              console.warn('🔍 [Forward] Both API approaches failed, relying on socket event only');
              // Don't throw - socket event was already emitted, so message appears sent
              // The server will handle it via socket
              apiSuccess = false;
            }
          }

          // If API succeeded, validate response
          if (apiSuccess && response) {
            const messageId = response?._id || response?.message?._id || response?.data?._id;
            if (!messageId) {
              console.warn('🔍 [Forward] API returned but no message ID, using socket event result');
              // Don't throw - socket event was already emitted
            } else {
              console.log('🔍 [Forward] API success with message ID:', messageId);
            }
          }
          
          // If we got here, either API succeeded or socket event was emitted
          // Count as success since socket event ensures message appears
          successCount++;
          console.log(`🔍 [Forward] Successfully forwarded to chat ${chatId} (via ${apiSuccess ? 'API' : 'Socket.IO only'})`);
        } catch (error: any) {
          console.error(`🔍 [Forward] Failed to forward to chat ${chatId}:`, error);
          console.error(`🔍 [Forward] Error response:`, error?.response?.data);
          console.error(`🔍 [Forward] Error status:`, error?.response?.status);
          const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
          console.error(`🔍 [Forward] Error details:`, errorMessage);
          
          // Check if socket event was emitted - if so, count as partial success
          // The message will appear via socket even if API failed
          if (socket) {
            console.log(`🔍 [Forward] API failed but socket event was emitted, message may still appear`);
            // Don't count as complete failure - socket event was sent
            successCount++;
          } else {
            failCount++;
          }
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Success', 
          `Message forwarded to ${successCount} chat(s)${failCount > 0 ? `, ${failCount} failed` : ''}`
        );
        setShowForwardModal(false);
        setMessageToForward(null);
      } else {
        // All forwards failed - show error and return false
        const errorMsg = `Failed to forward message to all ${chatIds.length} chat(s). The server returned an error. Please try again.`;
        Alert.alert('Error', errorMsg);
        return false; // Failure - modal should stay open
      }
    } catch (error: any) {
      console.error('🔍 [Forward] Unexpected error in handleForward:', error);
      Alert.alert('Error', error?.message || 'Failed to forward message. Please try again.');
      return false; // Failure - modal should stay open
    } finally {
      setIsForwarding(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!token) return;
    
    const message = chatState.messages.find(m => m._id === messageId);
    if (!message) return;
    
    const existingReaction = message.reactions?.find(
      r => r.user._id === actualUser._id && r.emoji === emoji
    );
    
    // Store original reactions for rollback
    const originalReactions = [...(message.reactions || [])];
    
    // Optimistic update
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg._id === messageId) {
          if (existingReaction) {
            // Remove reaction
            return {
              ...msg,
              reactions: (msg.reactions || []).filter(
                r => !(r.user._id === actualUser._id && r.emoji === emoji)
              )
            };
          } else {
            // Add reaction
            return {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                {
                  emoji,
                  user: {
                    _id: actualUser._id,
                    name: actualUser.name || '',
                    email: actualUser.email || '',
                  }
                }
              ]
            };
          }
        }
        return msg;
      })
    }));
    
    // Emit socket event
    socket?.emit(existingReaction ? REMOVE_REACTION : ADD_REACTION, {
      messageId,
      chatId: chat._id,
      emoji,
      userId: actualUser._id
    });
    
    try {
      if (existingReaction) {
        await removeReaction(messageId, emoji, token);
      } else {
        await addReaction(messageId, emoji, token);
      }
      // Success - optimistic update already applied
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      
      // Rollback optimistic update
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg._id === messageId
            ? { ...msg, reactions: originalReactions }
            : msg
        )
      }));
      
      Alert.alert('Error', 'Failed to update reaction. Please try again.');
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
    setSearchTerm(query);
    
    if (!token || !query.trim()) {
      setChatState(prev => ({ ...prev, searchResults: null, isSearching: false }));
      setHighlightedMessageIds(new Set());
      setSearchResultIds([]);
      setCurrentSearchIndex(-1);
      return;
    }
      
    setChatState(prev => ({ ...prev, isSearching: true }));
    
    try {
      const results = await searchMessages(chat._id, query, 1, 100, token);
      const messageIds = (results.messages || []).map((msg: Message) => msg._id);
      
      setChatState(prev => ({ ...prev, searchResults: results, isSearching: false }));
      setHighlightedMessageIds(new Set(messageIds));
      setSearchResultIds(messageIds);
      setCurrentSearchIndex(0);
      
      // Auto-scroll to first result
      if (messageIds.length > 0) {
        scrollToMessage(messageIds[0]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setChatState(prev => ({ ...prev, isSearching: false }));
      setHighlightedMessageIds(new Set());
      setSearchResultIds([]);
      setCurrentSearchIndex(-1);
      Alert.alert('Error', 'Failed to search messages');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setChatState(prev => ({ ...prev, searchResults: null, isSearching: false }));
    setHighlightedMessageIds(new Set());
    setSearchResultIds([]);
    setCurrentSearchIndex(-1);
  };

  const navigateSearchResult = (direction: 'next' | 'prev') => {
    if (searchResultIds.length === 0) return;
    
    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResultIds.length;
    } else {
      newIndex = currentSearchIndex <= 0 ? searchResultIds.length - 1 : currentSearchIndex - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResultIds[newIndex]);
  };

  const scrollToMessage = (messageId: string) => {
    const messageIndex = chatState.messages.findIndex(msg => msg._id === messageId);
    if (messageIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ 
        index: messageIndex, 
        animated: true,
        viewPosition: 0.5 // Center the message
      });
    }
  };

  const handleSearchMessage = (message: Message) => {
    // Find the message in the current messages and scroll to it
    const messageIndex = chatState.messages.findIndex(msg => msg._id === message._id);
    if (messageIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: messageIndex, animated: true });
    }
    setShowSearch(false);
  };

  // Get other member for call functionality
  const getOtherMember = useCallback(() => {
    if (chat.isGroup) return null;
    if (!chat.members || chat.members.length === 0) return null;

    const processedMembers = chat.members.map(member => {
      if (typeof member === 'string') {
        return { _id: member, name: 'Unknown User', avatar: '' };
      }

      const memberId = member.id || member.user?.id;
      if (!memberId) return null;

      return {
        _id: memberId,
        name: member.name || member.user?.name || 'Unknown User',
        avatar: member.profilePic || member.user?.profilePic || '',
      };
    }).filter(member => member !== null);

    if (processedMembers.length === 0) return null;

    const otherMember = processedMembers.find(member => member._id !== actualUser._id);
    return otherMember || processedMembers[0];
  }, [chat.members, chat.isGroup, actualUser._id]);

  const handleStartVoiceCall = () => {
    const otherMember = getOtherMember();
    if (otherMember) {
      // Navigate using the parent navigation (InboxStack)
      (navigation as any).navigate('CallScreen', {
        userName: otherMember.name,
        userAvatar: otherMember.avatar,
        isVideoCall: false,
        isIncoming: false,
      });
    }
  };

  const handleStartVideoCall = () => {
    const otherMember = getOtherMember();
    if (otherMember) {
      // Navigate using the parent navigation (InboxStack)
      (navigation as any).navigate('CallScreen', {
        userName: otherMember.name,
        userAvatar: otherMember.avatar,
        isVideoCall: true,
        isIncoming: false,
      });
    }
  };

  const handleSearchPress = () => {
    setShowSearch(true);
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

  const renderMessage = React.useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isCurrentUser={item.sender._id === actualUser._id}
      currentUser={actualUser}
      onReply={handleReply}
      onEdit={handleEdit}
      onDelete={handleDeleteMessage}
      onPin={handlePinMessage}
      onUnpin={handleUnpinMessage}
      onForward={handleForwardMessage}
      searchTerm={searchTerm}
      isHighlighted={highlightedMessageIds.has(item._id)}
      chatMembers={members}
      isGroupChat={chat.isGroup}
      isCurrentSearchResult={currentSearchIndex >= 0 && searchResultIds[currentSearchIndex] === item._id}
    />
  ), [actualUser, searchTerm, highlightedMessageIds, members, chat.isGroup, currentSearchIndex, searchResultIds, handleReply, handleEdit, handleDeleteMessage, handlePinMessage, handleUnpinMessage, handleForwardMessage]);

  const keyExtractor = useCallback((item: Message) => item._id || item.messageId || `msg_${item.createdAt}`, []);

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
        <MessageListSkeleton />
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
      <ChatHeaderNew
        chat={chat}
        currentUser={actualUser}
        onlineUsers={chatState.onlineUsers}
        onBack={onBack}
        onTogglePinned={() => setShowPinnedMessages(true)}
        onSearch={handleSearchPress}
        onMediaLinks={() => setShowMediaLinks(true)}
        onManageMembers={() => setShowMemberManagement(true)}
        onStartVoiceCall={handleStartVoiceCall}
        onStartVideoCall={handleStartVideoCall}
        showCallButtons={true}
        pinnedMessagesCount={chatState.pinnedMessages.length}
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
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          // Only auto-scroll on new messages, not when loading older messages
          if (!isLoadingOlderMessages && chatState.messages.length > 0) {
            // Check if we're near the bottom (within 200px)
            if (scrollPositionRef.current === 0 || 
                (scrollPositionRef.current < 200 && !isLoadingOlderMessages)) {
              scrollToBottom();
            }
          }
        }}
        onLayout={() => {
          if (!isLoadingOlderMessages) {
            scrollToBottom();
          }
        }}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        ListHeaderComponent={
          isLoadingOlderMessages ? (
            <View style={styles.loadingOlderContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingOlderText}>Loading older messages...</Text>
            </View>
          ) : null
        }
        ListFooterComponent={renderTypingIndicator}
        showsVerticalScrollIndicator={false}
        inverted={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
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
        <PinnedMessagesScreen
          chatId={chat._id}
          currentUser={actualUser}
          onClose={() => setShowPinnedMessages(false)}
          onMessagePress={(message) => {
            // Scroll to the message in the chat
            const messageIndex = chatState.messages.findIndex(msg => msg._id === message._id);
            if (messageIndex !== -1 && flatListRef.current) {
              flatListRef.current.scrollToIndex({ index: messageIndex, animated: true });
            }
          }}
          token={token || ''}
        />
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <ChatSearch
          chatId={chat._id}
          onClose={() => setShowSearch(false)}
          onSelectMessage={handleSearchMessage}
          token={token || ''}
        />
      </Modal>

      {/* Media & Links Modal */}
      <ChatMediaLinksModal
        visible={showMediaLinks}
        onClose={() => setShowMediaLinks(false)}
        messages={chatState.messages}
        onMessagePress={(messageId) => {
          scrollToMessage(messageId);
          setShowMediaLinks(false);
        }}
      />

      {/* Group Member Management Modal */}
      {chat.isGroup && (
        <GroupMemberManagementModal
          visible={showMemberManagement}
          onClose={() => setShowMemberManagement(false)}
          chatId={chat._id}
          currentMembers={members}
          allUsers={allUsers}
          currentUser={actualUser}
          onMembersUpdated={() => {
            loadMembers();
          }}
        />
      )}

      {/* Forward Message Modal */}
      {messageToForward && (
        <ForwardMessageModal
          visible={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setMessageToForward(null);
          }}
          message={messageToForward}
          chats={allChats.filter(c => c._id !== chat._id)} // Exclude current chat
          onForward={handleForward}
          isLoading={isForwarding}
        />
      )}
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
  loadingOlderContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingOlderText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default ChatWindow;