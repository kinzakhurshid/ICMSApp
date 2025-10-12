import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Modal, Animated } from 'react-native';
import { Chat, Message, User, ChatWithUnread, NewMessageAlertData } from '../types/chattypes';
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

interface ChatContainerProps {
  currentUser: User;
}

const { width } = Dimensions.get('window');

const ChatContainer: React.FC<ChatContainerProps> = ({ currentUser }) => {
  const [selectedChat, setSelectedChat] = useState<ChatWithUnread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatLastMessages, setChatLastMessages] = useState<Record<string, Message>>({});
  const [chatTimestamps, setChatTimestamps] = useState<Record<string, number>>({});
  const [notificationPopup, setNotificationPopup] = useState<NewMessageAlertData | null>(null);
  const { callApi } = useAxios();
  const { myChats, myChatLoading } = useChat();
  const { socket } = useSocket();
  const { addNotification } = useNotifications();

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
    Alert.alert('Parent Component', `Chat selected: ${chat._id}`);
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

  const newMessageAlertListener = useCallback(
    (data: NewMessageAlertData) => {
      console.log('🔥 NEW_NOTIFICATION_ALERT received:', data);
      console.log('🔥 Current selected chat:', selectedChat?._id);
      console.log('🔥 Chat ID from notification:', data.chatId);
      
      if (selectedChat && selectedChat._id === data.chatId) {
        console.log('🔥 Chat is currently selected, not showing notification');
        return;
      }

      console.log('🔥 Updating chat timestamps and unread counts');
      setChatTimestamps((prev) => ({
        ...prev,
        [data.chatId]: Date.now(),
      }));

      setUnreadCounts((prev) => {
        const currentCount = prev[data.chatId] || 0;
        const newCount = currentCount + 1;
        console.log('🔥 Updating unread count for chat', data.chatId, 'from', currentCount, 'to', newCount);
        return {
          ...prev,
          [data.chatId]: newCount,
        };
      });

      // Show notification popup
      try {
        console.log('🔥 Creating notification popup');
        setNotificationPopup(data);
        
        // Add to notification context for the notification screen
        const notification = {
          _id: data.messageId,
          sender: {
            _id: data.senderId,
            name: data.senderName,
            avatar: undefined,
          },
          receiver: currentUser._id,
          message: {
            _id: data.messageId,
            content: data.messageContent,
            messageType: 'text' as const,
          },
          chat: {
            _id: data.chatId,
            name: data.chatName || 'Chat',
            type: 'direct' as const,
          },
          type: 'message' as const,
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        addNotification(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setNotificationPopup(null);
        }, 5000);
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    },
    [selectedChat, currentUser, addNotification]
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
    console.log('🔥 NEW_MESSAGE received in ChatContainer:', data);
    
    // If message is from another user and chat is not currently selected
    if (data.message?.sender?._id !== currentUser._id && 
        (!selectedChat || selectedChat._id !== data.chatId)) {
      
      console.log('🔥 Message from another user, triggering notification');
      
      // Create notification data
      const notificationData: NewMessageAlertData = {
        messageId: data.message._id,
        chatId: data.chatId,
        senderId: data.message.sender._id,
        senderName: data.message.sender.name,
        messageContent: data.message.content,
        chatName: data.chat?.name || 'Chat'
      };
      
      // Trigger notification
      newMessageAlertListener(notificationData);
    }
  }, [currentUser, selectedChat, newMessageAlertListener]);

  const eventHandler = {
    [NEW_NOTIFICATION_ALERT]: newMessageAlertListener,
    [UPDATE_LAST_MESSAGE]: updateLastMessageEventListener,
    [NEW_MESSAGE]: handleNewMessage,
  };

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
            currentUser={currentUser}
            onMarkAsRead={() => markChatAsRead(selectedChat._id)}
            onBack={handleBackToList}
          />
        </View>
      )}

      {/* WhatsApp-like Notification Popup */}
      {notificationPopup && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setNotificationPopup(null)}
        >
          <View style={styles.notificationOverlay}>
            <TouchableOpacity
              style={styles.notificationPopup}
              onPress={() => setNotificationPopup(null)}
              activeOpacity={0.9}
            >
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notificationPopup.senderName}</Text>
                <Text style={styles.notificationChat}>{notificationPopup.chatName}</Text>
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notificationPopup.messageContent}
              </Text>
              <View style={styles.notificationActions}>
                <TouchableOpacity
                  style={styles.notificationActionButton}
                  onPress={() => {
                    // Navigate to chat
                    const chat = myChats.find(c => c._id === notificationPopup.chatId);
                    if (chat) {
                      setSelectedChat(chat);
                      setNotificationPopup(null);
                    }
                  }}
                >
                  <Text style={styles.notificationActionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.notificationActionButton}
                  onPress={() => setNotificationPopup(null)}
                >
                  <Text style={styles.notificationActionText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
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
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  notificationPopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationHeader: {
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notificationChat: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  notificationActionButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  notificationActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ChatContainer;