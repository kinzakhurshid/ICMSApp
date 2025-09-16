import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
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
} from '../constants/events';
import { useSocket } from '../Context/SocketContext';
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
  const { callApi } = useAxios();
  const { myChats, myChatLoading } = useChat();
  const { socket } = useSocket();

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
      if (selectedChat && selectedChat._id === data.chatId) {
        return;
      }

      setChatTimestamps((prev) => ({
        ...prev,
        [data.chatId]: Date.now(),
      }));

      setUnreadCounts((prev) => {
        const currentCount = prev[data.chatId] || 0;
        return {
          ...prev,
          [data.chatId]: currentCount + 1,
        };
      });
    },
    [selectedChat]
  );

  const updateLastMessageEventListener = useCallback((data: any) => {
    const newMessage = createMessage(data);
    setChatLastMessages((prev) => ({
      ...prev,
      [data.chatId]: newMessage,
    }));
  }, []);

  const eventHandler = {
    [NEW_NOTIFICATION_ALERT]: newMessageAlertListener,
    [UPDATE_LAST_MESSAGE]: updateLastMessageEventListener,
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
});

export default ChatContainer;