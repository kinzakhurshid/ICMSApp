import { useState, useEffect, useCallback } from 'react';
import { Chat, Message } from '../types/chattypes';
import useAxios from './useAxios';

const useChat = () => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myChats, setMyChats] = useState<Chat[]>([]);
  const [myNotifications, setMyNotifications] = useState<any[]>([]);
  const [myChatLoading, setMyChatLoading] = useState(false);
  const { callApi } = useAxios();

  const fetchMessages = async (chatId: string) => {
    setLoading(true);
    setError(null);
    try {
      setMessages([]);
    } catch (err) {
      setError("Failed to fetch messages");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyChats = async () => {
    setMyChatLoading(true);
    setError(null);
    try {
      const response = await callApi({
        method: "GET",
        url: "/chats/my-chats",
      });
      setMyChats(response?.data?.chats || []);
      setMyChatLoading(false);
    } catch (error) {
      console.log("Error while fetching my chats", error);
    }
  };

  const sendMessage = async (content: string, attachments: any[] = []) => {
    if (!currentChat) return;

    try {
      const newMessage: Message = {
        _id: `msg${Date.now()}`,
        content,
        attachments,
        sender: { _id: "currentUser", name: "You", avatar: "", email: "" },
        chat: currentChat._id,
        readBy: [],
        deletedFor: [],
        reactions: [],
        type: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMessages([...messages, newMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  useEffect(() => {
    fetchMyChats();
  }, []);

  return {
    currentChat,
    messages,
    loading,
    error,
    setCurrentChat,
    fetchMessages,
    sendMessage,
    fetchMyChats,
    myChats,
    myChatLoading,
  };
};

export default useChat;