import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Modal, Animated } from 'react-native';
import { Chat, Message, User, ChatWithUnread, NewMessageAlertData } from '../types/chattypes';
import { InboxNotification } from '../Context/NotificationContext';
import ChatList from './chatList';
import ChatWindow from './chatWindow';
import useChat from '../hooks/useChat';
import useAxios from '../hooks/useAxios';
import useSocketEvents from '../hooks/useSocketEvent';
import {
  NEW_MESSAGE_ALERT,
  NEW_NOTIFICATION_ALERT,
  UPDATE_LAST_MESSAGE,
  NEW_MESSAGE,
} from '../constants/events';
import { useSocket } from '../Context/SocketContext';
import { useNotifications } from '../Context/NotificationContext';
import { ArrowLeft } from 'react-native-feather';
import { Alert } from 'react-native';
import { navigationRef } from '../Services/NavigationService';

interface ChatContainerProps {
  currentUser: User;
  initialChatId?: string;
}

const { width } = Dimensions.get('window');

const ChatContainer: React.FC<ChatContainerProps> = ({ currentUser, initialChatId }) => {
  const [selectedChat, setSelectedChat] = useState<ChatWithUnread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatLastMessages, setChatLastMessages] = useState<Record<string, Message>>({});
  const [chatTimestamps, setChatTimestamps] = useState<Record<string, number>>({});
  // Notification popup is now handled globally by NotificationManager
  const { callApi } = useAxios();
  const { myChats, myChatLoading } = useChat();
  const { socket } = useSocket();
  const { addNotification, chatToOpen, openChat } = useNotifications();
  
  // Register openChat callback globally so NotificationService can use it
  useEffect(() => {
    (global as any).openChatCallback = (chatId: string) => {
      console.log('ChatContainer: openChatCallback called with:', chatId);
      openChat(chatId);
    };
    
    return () => {
      delete (global as any).openChatCallback;
    };
  }, [openChat]);

  useEffect(() => {
    if (myChats.length > 0) {
      const initialUnreadCounts: Record<string, number> = {};
      const initialTimestamps: Record<string, number> = {};
      const initialLastMessages: Record<string, Message> = {};

      myChats.forEach((chat) => {
        initialUnreadCounts[chat._id] = (chat as any).unreadCount || 0;
        initialTimestamps[chat._id] = chat.updatedAt
          ? new Date(chat.updatedAt).getTime()
          : Date.now();
        if (chat.lastMessage) {
          initialLastMessages[chat._id] = chat.lastMessage;
        }
      });

      setUnreadCounts(initialUnreadCounts);
      setChatTimestamps(initialTimestamps);
      setChatLastMessages(initialLastMessages);
    }
  }, [myChats]);

  // Open chat from initialChatId prop (from navigation params/notifications)
  useEffect(() => {
    if (initialChatId && myChats.length > 0 && !selectedChat) {
      console.log('ChatContainer: Opening chat from initialChatId:', initialChatId);
      const chatToOpen = myChats.find(chat => chat._id === initialChatId);
      if (chatToOpen) {
        console.log('ChatContainer: Found chat, opening:', chatToOpen._id);
        handleChatSelect(chatToOpen);
      } else {
        console.log('ChatContainer: Chat not found in myChats:', initialChatId);
      }
    }
  }, [initialChatId, myChats, selectedChat]);

  // Open chat from NotificationContext (from notification taps)
  useEffect(() => {
    if (chatToOpen && myChats.length > 0) {
      console.log('ChatContainer: Opening chat from NotificationContext:', chatToOpen);
      const chat = myChats.find(c => c._id === chatToOpen);
      if (chat && (!selectedChat || selectedChat._id !== chatToOpen)) {
        console.log('ChatContainer: Found chat from context, opening:', chat._id);
        handleChatSelect(chat);
      } else if (!chat) {
        console.log('ChatContainer: Chat not found in myChats:', chatToOpen);
      }
    }
  }, [chatToOpen, myChats, selectedChat]);
  
  // Also listen to global pendingChatId (fallback)
  useEffect(() => {
    const checkPendingChat = () => {
      if ((global as any).pendingChatId && myChats.length > 0) {
        const pendingId = (global as any).pendingChatId;
        console.log('ChatContainer: Found pendingChatId:', pendingId);
        const chat = myChats.find(c => c._id === pendingId);
        if (chat && (!selectedChat || selectedChat._id !== pendingId)) {
          console.log('ChatContainer: Opening chat from pendingChatId:', chat._id);
          handleChatSelect(chat);
          (global as any).pendingChatId = null; // Clear after opening
        }
      }
    };
    
    if (myChats.length > 0) {
      checkPendingChat();
      // Check periodically for a short time
      const interval = setInterval(() => {
        checkPendingChat();
      }, 200);
      
      setTimeout(() => clearInterval(interval), 2000);
    }
  }, [myChats, selectedChat]);

  const markChatAsRead = async (chatId: string) => {
    try {
      await callApi({
        method: "GET",
        url: `/chats/readChat/${chatId}`,
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [chat._id]: 0,
    }));

    setSelectedChat({
      ...chat,
      unreadCount: 0,
      lastUpdated: Date.now(),
    } as ChatWithUnread);

    markChatAsRead(chat._id);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const getChatsWithUpdatedUnreadCounts = (): ChatWithUnread[] => {
    const chatsWithUnread = myChats.map((chat) => {
      const updatedChat = {
        ...chat,
        unreadCount: unreadCounts[chat._id] ?? (chat as any).unreadCount ?? 0,
        lastUpdated: chatTimestamps[chat._id] ?? new Date(chat.updatedAt).getTime(),
      } as ChatWithUnread;

      if (chatLastMessages[chat._id]) {
        updatedChat.lastMessage = chatLastMessages[chat._id];
      }

      return updatedChat;
    });

    return chatsWithUnread.sort((a, b) => b.lastUpdated - a.lastUpdated);
  };

  // Function to extract sender name from message content (same as NotificationsScreen)
  const extractSenderNameFromMessage = (message: string): string | null => {
    // Look for patterns like "You have a new message from [Name]"
    const fromMatch = message.match(/from\s+([^,\n]+)/i);
    if (fromMatch && fromMatch[1]) {
      return fromMatch[1].trim();
    }
    
    // Look for other patterns
    const nameMatch = message.match(/(?:message|notification)\s+from\s+([^,\n]+)/i);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
    
    return null;
  };

  const newMessageAlertListener = useCallback(
    (data: any) => {
      console.log('🔍 newMessageAlertListener called with data:', data);
      
      // Don't increment unread count if user is currently viewing this chat
      if (selectedChat && selectedChat._id === data.chatId) {
        console.log('🔍 User is viewing this chat, not incrementing unread count');
        return;
      }

      // Update timestamp
      setChatTimestamps((prev) => ({
        ...prev,
        [data.chatId]: Date.now(),
      }));

      // Increment unread count only once
      setUnreadCounts((prev) => {
        const currentCount = prev[data.chatId] || 0;
        const newCount = currentCount + 1;
        console.log(`🔍 Updating unread count for chat ${data.chatId}: ${currentCount} -> ${newCount}`);
        return {
          ...prev,
          [data.chatId]: newCount,
        };
      });

      // Show notification popup only (notification creation is handled in handleNewMessage)
      try {
        console.log('🔍 Setting notification popup:', data);
        
        // Debug logging to understand the incoming data structure
        console.log('🔍 ===== CHAT CONTAINER NEW MESSAGE ALERT =====');
        console.log('🔍 Raw socket data received:', JSON.stringify(data, null, 2));
        console.log('🔍 Data sender:', JSON.stringify(data.sender, null, 2));
        console.log('🔍 Data message sender:', JSON.stringify(data.message?.sender, null, 2));
        console.log('🔍 Data message:', JSON.stringify(data.message, null, 2));
        console.log('🔍 Data metadata:', JSON.stringify(data.metadata, null, 2));
        
        // Convert socket data to proper notification format
        const sender = data.sender || data.message?.sender;
        const notificationData: InboxNotification = {
          _id: data._id || Date.now().toString(),
          receiver: currentUser?._id || '',
          sender: sender || { _id: '', username: 'Unknown User', name: 'Unknown User' },
          type: (data.type || 'message') as "message" | "reaction" | "mention" | "system" | "group_invite",
          chat: data.chat,
          relatedMessage: data.message,
          title: data.title || 'New Message',
          body: data.message?.content || data.body || 'New message',
          metadata: {
            ...data.metadata,
            senderName: sender?.name || sender?.username || 'Unknown User'
          },
          read: false,
          delivered: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('🔍 Converted notification data:', JSON.stringify(notificationData, null, 2));
        console.log('🔍 Final sender object:', JSON.stringify(notificationData.sender, null, 2));
        console.log('🔍 Final metadata:', JSON.stringify(notificationData.metadata, null, 2));
        console.log('🔍 ===== END CHAT CONTAINER NEW MESSAGE ALERT =====');
        
        // Notification popup is now handled globally by NotificationManager
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    },
    [selectedChat, currentUser]
  );

  const updateLastMessageEventListener = useCallback((data: any) => {
    const newMessage = createMessage(data);
    setChatLastMessages((prev) => ({
      ...prev,
      [data.chatId]: newMessage,
    }));
  }, []);

  // Handle real NEW_MESSAGE events from backend
  const handleNewMessage = useCallback((data: any) => {
    console.log('🔍 handleNewMessage called with data:', data);
    
    // If message is from another user and chat is not currently selected
    if (data.message?.sender?._id !== currentUser._id && 
        (!selectedChat || selectedChat._id !== data.chatId)) {
      
      console.log('🔍 Message is from another user and chat is not selected');
      
      // Update chat timestamps (unread count will be handled by newMessageAlertListener)
      setChatTimestamps((prev) => ({
        ...prev,
        [data.chatId]: Date.now(),
      }));

      // Update last message
      const newMessage = createMessage(data);
      setChatLastMessages((prev) => ({
        ...prev,
        [data.chatId]: newMessage,
      }));

      // Show notification popup
      try {
        console.log('🔍 Setting notification popup from handleNewMessage:', data);
        
        // Debug logging to understand the incoming data structure
        console.log('🔍 ===== CHAT CONTAINER HANDLE NEW MESSAGE =====');
        console.log('🔍 Raw handleNewMessage data received:', JSON.stringify(data, null, 2));
        console.log('🔍 Message sender:', JSON.stringify(data.message?.sender, null, 2));
        console.log('🔍 Data sender:', JSON.stringify(data.sender, null, 2));
        console.log('🔍 Message content:', data.message?.content);
        console.log('🔍 Data metadata:', JSON.stringify(data.metadata, null, 2));
        
        // Convert socket data to proper notification format
        const sender = data.message?.sender || data.sender;
        const notificationData: InboxNotification = {
          _id: data.message?._id || Date.now().toString(),
          receiver: currentUser?._id || '',
          sender: sender || { _id: '', username: 'Unknown User', name: 'Unknown User' },
          type: 'message',
          chat: data.chat,
          relatedMessage: data.message,
          title: 'New Message',
          body: data.message?.content || 'New message',
          metadata: {
            ...data.metadata,
            senderName: sender?.name || sender?.username || 'Unknown User'
          },
          read: false,
          delivered: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('🔍 Converted handleNewMessage notification data:', JSON.stringify(notificationData, null, 2));
        console.log('🔍 Final sender object:', JSON.stringify(notificationData.sender, null, 2));
        console.log('🔍 Final metadata:', JSON.stringify(notificationData.metadata, null, 2));
        console.log('🔍 ===== END CHAT CONTAINER HANDLE NEW MESSAGE =====');
        
        // Add to notification context for the notification screen
        const notification: InboxNotification = {
          _id: data.message?._id || `msg_${Date.now()}`,
          receiver: currentUser?._id || '',
          sender: sender || { _id: '', username: 'Unknown User', name: 'Unknown User' },
          type: 'message',
          chat: data.chat,
          relatedMessage: data.message,
          title: 'New Message',
          body: data.message?.content || 'New message',
          metadata: {
            ...data.metadata,
            senderName: sender?.name || sender?.username || 'Unknown User'
          },
          read: false,
          delivered: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        addNotification(notification);
        
        // Notification popup is now handled globally by NotificationManager
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }, [currentUser, selectedChat, addNotification]);

  // Socket events are now handled globally by NotificationManager
  // Only keep the updateLastMessageEventListener for chat list updates
  // Memoize eventHandler to prevent constant re-registration
  const eventHandler = useMemo(() => ({
    [UPDATE_LAST_MESSAGE]: updateLastMessageEventListener,
  }), [updateLastMessageEventListener]);

  useSocketEvents(socket, eventHandler);

  return (
    <View style={styles.container}>
      {/* Chat List View - shown when no chat is selected */}
      {!selectedChat && (
        <View style={styles.chatListContainer}>
          <ChatList
            currentUser={currentUser}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            searchQuery={searchQuery}
            myChatLoading={myChatLoading}
            onSearchChange={setSearchQuery}
            chats={getChatsWithUpdatedUnreadCounts()}
          />
        </View>
      )}

      {/* Chat Window View - shown when a chat is selected */}
      {selectedChat && (
        <View style={styles.chatWindowContainer}>
          <ChatWindow
            chat={selectedChat}
            currentUser={{ currentUser }}
            onMarkAsRead={() => markChatAsRead(selectedChat._id)}
            onBack={handleBackToList}
            allChats={myChats}
          />
        </View>
      )}

      {/* Notification popup is now handled globally by NotificationManager */}
    </View>
  );
};

const createMessage = (data: NewMessageAlertData): Message => {
  return {
    _id: `temp-${Date.now()}`,
    content: data?.message?.content || "New message",
    sender: data?.sender || {
      _id: "unknown",
      name: "Unknown",
      profilePic: "",
    },
    chat: data.chatId,
    readBy: [],
    deletedFor: [],
    reactions: [],
    type: "text",
    attachments: [],
    createdAt: data.notification?.createdAt
      ? new Date(data.notification.createdAt)
      : new Date(),
    updatedAt: new Date(),
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatListContainer: {
    flex: 1,
  },
  chatWindowContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#6B7280',
    textAlign: 'center',
  },
  // Notification popup styles removed - now handled globally by NotificationManager
});

export default ChatContainer;