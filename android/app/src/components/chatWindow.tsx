import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Chat, Message, User } from '../types/chattypes';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubbles';
import MessageInput from './MessageInput';
import PinnedMessages from './PinedMessages';
import { useSocket } from '../Context/SocketContext';
import useSocketEvents from '../hooks/useSocketEvent';
import useAxios from '../hooks/useAxios';
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  DELETE_MESSAGE,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  NEW_REACTION,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
  UPDATE_MESSAGE,
} from '../constants/events';

interface ChatWindowProps {
  chat: Chat;
  currentUser: User;
  onMarkAsRead: () => void;
  onBack: () => void;
}

interface ChatMessagesResponse {
  messages: Message[];
  groupedMessages: { [key: string]: Message[] };
  page: number;
  totalPages: number;
  totalMessages: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  currentUser,
  onMarkAsRead,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(true);
  const [newMessage, setNewMessage] = useState("");
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [IamTyping, setIamTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const members = chat.members;
  const isGroupChat = chat.isGroup || chat.members.length > 2;
  const { socket } = useSocket();
  const { callApi } = useAxios();

  useEffect(() => {
    if (chat.unreadCount && chat.unreadCount > 0) {
      onMarkAsRead();
    }
  }, [chat._id, onMarkAsRead]);

  useEffect(() => {
    const getChatDetails = async () => {
      setMessagesLoading(true);
      try {
        const response: ChatMessagesResponse = await callApi({
          method: "GET",
          url: `/chats/getChatMessages/${chat._id}`,
        });

        const sortedMessages = (response.messages || []).map(msg => ({
          ...msg,
          id: msg._id
        })).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages(sortedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };
    getChatDetails();
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket?.emit(CHAT_JOINED, {
      userId: currentUser._id,
      members,
      chatId: chat._id,
    });

    return () => {
      setMessages([]);
      socket?.emit(CHAT_LEAVED, {
        userId: currentUser._id,
        members,
        chatId: chat._id,
      });
    };
  }, [chat]);

  const scrollToBottom = () => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);

    if (!IamTyping) {
      socket?.emit(START_TYPING, { members, chatId: chat._id });
      setIamTyping(true);
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket?.emit(STOP_TYPING, { members, chatId: chat._id });
      setIamTyping(false);
    }, 2000);
  };

  const handleSendMessage = (text: string, messageAttachments?: any[]) => {
    if (!text.trim() && (!messageAttachments || messageAttachments.length === 0)) return;

    const message: Message = {
      _id: `msg${Date.now()}`,
      messageId: `msg${Date.now()}`,
      content: text,
      sender: {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser?.profilePic || "",
        profilePic: currentUser?.profilePic || "",
      },
      chat: chat._id,
      readBy: [],
      deletedFor: [],
      reactions: [],
      type: messageAttachments && messageAttachments.length > 0 ? "attachment" : "text",
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: messageAttachments || [],
    };

    setMessages((prev) => [...prev, message]);
    setAttachments([]);

    socket?.emit(NEW_MESSAGE, {
      chatId: chat._id,
      members,
      message,
      messageId: message.messageId,
    });
    setNewMessage("");
  };

  const handleAttachmentsUpload = (uploadedAttachments: any[]) => {
    setAttachments(uploadedAttachments);
  };

  const newMessagesListener = useCallback(
    (data: any) => {
      if (data.chatId !== chat._id) return;

      const newMessage = {
        ...data.message,
        id: data.message._id
      };

      setMessages((prev) => {
        const newMessages = [...prev];
        const insertIndex = newMessages.findIndex(
          (msg) => new Date(msg.createdAt) > new Date(newMessage.createdAt)
        );

        if (insertIndex === -1) {
          return [...prev, newMessage];
        } else {
          newMessages.splice(insertIndex, 0, newMessage);
          return newMessages;
        }
      });
    },
    [chat._id]
  );

  const onlineUsersListener = useCallback((data: any) => {
    setOnlineUsers(data);
  }, []);

  const reactionListener = useCallback(
    (data: any) => {
      if (data.chatId !== chat._id) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === data.message.messageId
            ? { ...msg, reactions: data.message.reactions }
            : msg
        )
      );
    },
    [chat._id]
  );

  const deleteMessageAlertListener = useCallback(
    (data: any) => {
      if (data.chatId !== chat._id) return;
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    },
    [chat._id]
  );

  const updateMessageAlertListener = useCallback(
    (data: any) => {
      if (data.chatId !== chat._id) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, ...data.message } : msg
        )
      );
    },
    [chat._id]
  );

  const startTypingListener = useCallback(
    (data: any) => {
      if (data.chatId !== chat._id) return;
      setUserTyping(true);
    },
    [chat._id]
  );

  const stopTypingListener = useCallback(
    (data: any) => {
      if (data.chatId !== chat._id) return;
      setUserTyping(false);
    },
    [chat._id]
  );

  const eventHandler = {
    [NEW_MESSAGE]: newMessagesListener,
    [ONLINE_USERS]: onlineUsersListener,
    [NEW_REACTION]: reactionListener,
    [NEW_MESSAGE_ALERT]: () => {},
    [DELETE_MESSAGE]: deleteMessageAlertListener,
    [UPDATE_MESSAGE]: updateMessageAlertListener,
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
  };

  useSocketEvents(socket, eventHandler);

  const renderItem = ({ item }: { item: Message }) => {
    return (
      <MessageBubble
        message={item}
        isCurrentUser={item.sender._id === currentUser.currentUser._id}
        currentUser={currentUser}
        typing={userTyping}
        isGroupChat={isGroupChat}
      />
    );
  };

  const MessageSkeleton = ({ isCurrentUser }: { isCurrentUser: boolean }) => (
    <View
      style={[
        styles.messageSkeletonContainer,
        isCurrentUser ? styles.currentUserSkeleton : styles.otherUserSkeleton,
      ]}
    >
      {!isCurrentUser && (
        <View style={styles.skeletonAvatar} />
      )}
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonBubble} />
        <View style={styles.skeletonTimestamp} />
      </View>
      {isCurrentUser && (
        <View style={styles.skeletonAvatar} />
      )}
    </View>
  );

  if (messagesLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSkeleton}>
          <View style={styles.headerAvatarSkeleton} />
          <View style={styles.headerTextSkeleton}>
            <View style={styles.headerNameSkeleton} />
            <View style={styles.headerStatusSkeleton} />
        </View>
        </View>

        <FlatList
          data={[...Array(8)]}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ index }) => (
            <MessageSkeleton isCurrentUser={index % 3 === 0} />
          )}
          contentContainerStyle={styles.messagesContainer}
        />

        <View style={styles.inputSkeleton}>
          <View style={styles.inputFieldSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        chat={chat}
        onlineUsers={onlineUsers}
        currentUser={currentUser}
        onTogglePinned={() => setShowPinnedMessages(!showPinnedMessages)}
        onBack={onBack}
      />

      {showPinnedMessages && (
        <PinnedMessages
          pinnedMessages={chat.pinnedMessages || []}
          onClose={() => setShowPinnedMessages(false)}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by sending a message!
            </Text>
          </View>
        }
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      <MessageInput
        value={newMessage}
        onChangeText={handleMessageChange}
        onSend={handleSendMessage}
        onAttachmentsUpload={handleAttachmentsUpload}
        chatId={chat._id}
        typing={userTyping}
        style={styles.messageInput}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  messageSkeletonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  currentUserSkeleton: {
    justifyContent: 'flex-end',
  },
  otherUserSkeleton: {
    justifyContent: 'flex-start',
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
  },
  skeletonContent: {
    maxWidth: '70%',
  },
  skeletonBubble: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 4,
  },
  skeletonTimestamp: {
    height: 12,
    width: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  headerAvatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  headerTextSkeleton: {
    flex: 1,
  },
  headerNameSkeleton: {
    height: 16,
    width: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 4,
  },
  headerStatusSkeleton: {
    height: 12,
    width: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  inputSkeleton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  inputFieldSkeleton: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
  },
  messageInput: {
    position: 'relative',
    width: '100%',
  },
});

export default ChatWindow;