import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Chat, Message, User } from '../types/chattypes';
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
  CALL_INVITE,
  CALL_ACCEPTED,
  CALL_REJECTED,
  CALL_ENDED,
  CALL_ICE_CANDIDATE,
  CALL_OFFER,
  CALL_ANSWER,
} from '../constants/events';
import CallScreen from './CallScreen';
import { callManager } from './callManager';
import webRTCManager from './WebRTCManeger';
import { requestAndroidPermissions } from '../constants/androidPermissions';

interface ChatWindowProps {
  chat: Chat;
  currentUser: { currentUser: User };
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
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentCallIdRef = useRef<string | null>(null);

  const members = chat.members;
  const isGroupChat = chat.isGroup || chat.members.length > 1;
  const { socket } = useSocket();
  const { callApi } = useAxios();

  // Get the actual user object
  const actualUser = currentUser.currentUser;

  // Initialize call manager with socket
  useEffect(() => {
    if (actualUser && socket) {
      callManager.initialize(actualUser);
      callManager.setSocket(socket);
    }
  }, [actualUser, socket]);

  // Update call manager when current user changes
  useEffect(() => {
    if (actualUser) {
      callManager.setCurrentUser(actualUser);
    }
  }, [actualUser]);

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      webRTCManager.close();
      webRTCManager.removeAllListeners();
    };
  }, []);

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
      userId: actualUser._id,
      members,
      chatId: chat._id,
    });

    return () => {
      setMessages([]);
      socket?.emit(CHAT_LEAVED, {
        userId: actualUser._id,
        members,
        chatId: chat._id,
      });
    };
  }, [chat]);

  // FIXED: Enhanced getOtherMember function
  const getOtherMember = useCallback(() => {
    console.log('=== getOtherMember Debug ===');
    console.log('Chat members:', JSON.stringify(chat.members, null, 2));
    console.log('Current user ID:', actualUser._id);
    console.log('Chat is group:', chat.isGroup);
    
    if (chat.isGroup) {
      console.log('❌ Chat is group, returning null');
      return null;
    }
    
    if (!chat.members || chat.members.length === 0) {
      console.log('❌ No members found');
      return null;
    }

    const processedMembers = chat.members.map(member => {
      console.log('Processing member:', member);
      
      if (typeof member === 'string') {
        return { _id: member, name: 'Unknown User', profilePic: '' };
      }
      
      const memberId = member.id;
      if (!memberId) {
        console.log('⚠️ Member has no ID:', member);
        return null;
      }
      
      return {
        _id: memberId,
        name: member.name || 'Unknown User',
        profilePic: member.profilePic || member.avatar || '',
      };
    }).filter(member => member !== null);

    console.log('Processed members:', processedMembers);

    if (processedMembers.length === 0) {
      console.log('❌ No valid members found after processing');
      return null;
    }

    const otherMember = processedMembers.find(member => 
      member._id !== actualUser._id
    );

    console.log('Found other member:', otherMember);

    if (!otherMember) {
      if (processedMembers.length === 1) {
        console.log('⚠️ Only one member found, using that member');
        return processedMembers[0];
      }
      console.log('❌ No other member found after processing');
      return null;
    }

    console.log('✅ Returning other member with ID:', otherMember._id);
    return otherMember;
  }, [chat.members, chat.isGroup, actualUser._id]);

  const otherMember = getOtherMember();
  
  // FIXED: Enhanced online users processing
  const processOnlineUsers = useCallback((data: any): string[] => {
    console.log('Processing online users data:', data);
    
    let onlineUserIds: string[] = [];
    
    if (Array.isArray(data)) {
      onlineUserIds = data
        .filter(userId => userId !== null && userId !== undefined)
        .map(userId => String(userId).trim())
        .filter(userId => userId.length > 0);
    } else if (typeof data === 'object' && data !== null) {
      onlineUserIds = Object.values(data)
        .filter(userId => userId !== null && userId !== undefined)
        .map(userId => String(userId).trim())
        .filter(userId => userId.length > 0);
    } else if (typeof data === 'string') {
      onlineUserIds = [data.trim()].filter(userId => userId.length > 0);
    }
    
    console.log('Processed online users IDs:', onlineUserIds);
    return onlineUserIds;
  }, []);

  // FIXED: Enhanced online users listener
  const onlineUsersListener = useCallback((data: any) => {
    console.log('Raw online users data received:', data);
    
    const processedUsers = processOnlineUsers(data);
    console.log('Setting online users:', processedUsers);
    setOnlineUsers(processedUsers);
  }, [processOnlineUsers]);

  // FIXED: Check if other user is online
  const isOtherUserOnline = useCallback(() => {
    if (!otherMember || !otherMember._id) {
      console.log('❌ Cannot check online status: no other member or ID');
      return false;
    }

    const otherMemberId = String(otherMember._id).trim();
    const isOnline = onlineUsers.some(userId => 
      String(userId).trim() === otherMemberId
    );

    console.log('Online status check:', {
      otherMemberId,
      onlineUsers,
      isOnline
    });

    return isOnline;
  }, [otherMember, onlineUsers]);

  // MODIFIED: Show call buttons even when user is offline
  const shouldShowCallButtons = useCallback(() => {
    console.log('=== MODIFIED: Call buttons for offline calling ===');
    
    if (chat.isGroup) {
      console.log('❌ Call buttons hidden: Chat is group');
      return false;
    }

    if (showCallScreen || isIncomingCall) {
      console.log('❌ Call buttons hidden: Active call in progress');
      return false;
    }

    if (!otherMember || !otherMember._id) {
      console.log('❌ Call buttons hidden: No valid other member');
      return false;
    }

    const showButtons = true;
    
    console.log('Call buttons visibility check:', {
      isGroup: chat.isGroup,
      showCallScreen,
      isIncomingCall,
      isOtherUserOnline: isOtherUserOnline(),
      hasOtherMember: !!otherMember,
      showCallButtons: showButtons
    });

    return showButtons;
  }, [chat.isGroup, showCallScreen, isIncomingCall, otherMember, isOtherUserOnline]);

  // FIXED: WebRTC helper functions with better error handling
  const startWebRTCConnection = async (isCaller: boolean, callType: 'voice' | 'video') => {
    try {
      console.log('🔄 Starting WebRTC connection:', { isCaller, callType });
      
      const initialized = await webRTCManager.initialize(callType);
      if (!initialized) {
        throw new Error('Failed to initialize WebRTC');
      }

      const currentCallId = currentCallIdRef.current;
      if (!currentCallId) {
        throw new Error('No active call ID');
      }

      // Set up WebRTC event listeners
      webRTCManager.on('iceCandidate', (candidate: any) => {
        if (!currentCallIdRef.current || currentCallIdRef.current !== currentCallId) {
          console.log('❌ Call ended, not sending ICE candidate');
          return;
        }
        
        console.log('Sending ICE candidate for call:', currentCallId);
        socket?.emit(CALL_ICE_CANDIDATE, {
          callId: currentCallId,
          candidate,
        });
      });

      webRTCManager.on('remoteStream', (stream: any) => {
        console.log('✅ Remote stream received');
      });

      webRTCManager.on('localStream', (stream: any) => {
        console.log('✅ Local stream ready');
      });

      webRTCManager.on('connectionStateChange', (state: string) => {
        console.log('🔌 WebRTC connection state:', state);
      });

      webRTCManager.on('iceConnectionStateChange', (state: string) => {
        console.log('❄️ WebRTC ICE connection state:', state);
      });

      if (isCaller) {
        console.log('🎥 Getting local media for call type:', callType);
        await webRTCManager.getLocalMedia(callType === 'video');
        
        console.log('📤 Creating offer...');
        const offer = await webRTCManager.createOffer();
        
        if (!currentCallIdRef.current || currentCallIdRef.current !== currentCallId) {
          console.log('❌ Call ended before offer could be sent');
          return;
        }
        
        console.log('✅ Sending offer via socket');
        socket?.emit(CALL_OFFER, {
          callId: currentCallId,
          offer,
        });
      }
      
      console.log('✅ WebRTC connection started successfully');
    } catch (error) {
      console.error('❌ Failed to start WebRTC connection:', error);
      Alert.alert('Error', 'Failed to start call connection. Please try again.');
    }
  };

  const handleIncomingOffer = async (offer: any) => {
    try {
      console.log('📥 Handling incoming offer');
      await webRTCManager.setRemoteDescription(offer);
      const answer = await webRTCManager.createAnswer();
      
      if (!currentCallIdRef.current) {
        console.log('❌ Call ended before answer could be sent');
        return;
      }
      
      console.log('✅ Sending answer via socket');
      socket?.emit(CALL_ANSWER, {
        callId: currentCallIdRef.current,
        answer,
      });
    } catch (error) {
      console.error('❌ Failed to handle call offer:', error);
    }
  };

  const handleIncomingAnswer = async (answer: any) => {
    try {
      console.log('📥 Handling incoming answer');
      await webRTCManager.setRemoteDescription(answer);
      console.log('✅ Remote description set successfully');
    } catch (error) {
      console.error('❌ Failed to handle call answer:', error);
    }
  };

  // MODIFIED: Call functions with offline support
  const startCall = async (callType: 'voice' | 'video') => {
    console.log('Starting call:', callType);
        if (Platform.OS === 'android') {
        const hasPermissions = await requestAndroidPermissions();
        if (!hasPermissions) {
            Alert.alert(
                'Permissions Required',
                'Camera and microphone permissions are required for calls.',
                [{ text: 'OK' }]
            );
            return;
        }
    }
    if (!otherMember) {
      Alert.alert('Error', 'Cannot start call: No valid receiver found');
      return;
    }

    // MODIFIED: Show warning but allow calling offline users
    if (!isOtherUserOnline()) {
      Alert.alert(
        'User Offline', 
        'The user is currently offline. They will receive the call notification when they come online.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call Anyway', onPress: () => proceedWithCall(callType) }
        ]
      );
      return;
    }

    await proceedWithCall(callType);
  };

  // New helper function to proceed with call
  const proceedWithCall = async (callType: 'voice' | 'video') => {
    try {
      console.log('📞 Proceeding with call type:', callType);
      const callData = await callManager.startCall(otherMember, callType);
      if (callData) {
        setCurrentCall(callData);
        currentCallIdRef.current = callData.callId;
        setShowCallScreen(true);
        setIsIncomingCall(false);
        
        // Initialize WebRTC for the caller with delay
        setTimeout(() => {
          startWebRTCConnection(true, callType);
        }, 500);
      }
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      Alert.alert('Error', 'Failed to start call. Please try again.');
    }
  };

  const acceptCall = () => {
    console.log('✅ Accepting call');
    callManager.acceptCall();
    setShowCallScreen(true);
    setIsIncomingCall(false);
    
    // Initialize WebRTC for the receiver
    setTimeout(() => {
      if (currentCall) {
        startWebRTCConnection(false, currentCall.type);
      }
    }, 500);
  };

  const rejectCall = () => {
    console.log('❌ Rejecting call');
    callManager.rejectCall();
    setIsIncomingCall(false);
    setCurrentCall(null);
    currentCallIdRef.current = null;
    webRTCManager.close();
  };

  const endCall = () => {
    console.log('📵 Ending call');
    
    // Close WebRTC connection first
    webRTCManager.close();
    
    // Then end the call through call manager
    callManager.endCall();
    
    // Finally update UI state
    setShowCallScreen(false);
    setCurrentCall(null);
    currentCallIdRef.current = null;
    setIsIncomingCall(false);
  };

  const toggleAudio = () => {
    const muted = !isAudioMuted;
    setIsAudioMuted(muted);
    webRTCManager.toggleAudio(!muted);
    console.log('🎙️ Audio toggled:', muted ? 'MUTED' : 'UNMUTED');
  };

  const toggleVideo = () => {
    const disabled = !isVideoDisabled;
    setIsVideoDisabled(disabled);
    webRTCManager.toggleVideo(!disabled);
    console.log('📹 Video toggled:', disabled ? 'DISABLED' : 'ENABLED');
  };

  const switchCamera = () => {
    webRTCManager.switchCamera();
    console.log('📸 Switching camera');
  };

  // Call event listeners
  useEffect(() => {
    const handleCallStarted = (callData: any) => {
      console.log('📞 Call started:', callData);
      setCurrentCall(callData);
      currentCallIdRef.current = callData.callId;
      setShowCallScreen(true);
      setIsIncomingCall(false);
    };

    const handleIncomingCall = (callData: any) => {
      console.log('📞 Incoming call:', callData);
      setCurrentCall(callData);
      currentCallIdRef.current = callData.callId;
      setIsIncomingCall(true);
    };

    const handleCallAccepted = (callData: any) => {
      console.log('✅ Call accepted:', callData);
      setCurrentCall(callData);
      currentCallIdRef.current = callData.callId;
      setShowCallScreen(true);
      setIsIncomingCall(false);
    };

    const handleCallEnded = () => {
      console.log('📵 Call ended');
      setShowCallScreen(false);
      setCurrentCall(null);
      currentCallIdRef.current = null;
      setIsIncomingCall(false);
      webRTCManager.close();
    };

    const handleCallRejected = () => {
      console.log('❌ Call rejected');
      setShowCallScreen(false);
      setCurrentCall(null);
      currentCallIdRef.current = null;
      setIsIncomingCall(false);
      webRTCManager.close();
    };

    callManager.on('callStarted', handleCallStarted);
    callManager.on('incomingCall', handleIncomingCall);
    callManager.on('callAccepted', handleCallAccepted);
    callManager.on('callEnded', handleCallEnded);
    callManager.on('callRejected', handleCallRejected);

    return () => {
      callManager.removeAllListeners();
    };
  }, []);

  // FIXED: WebRTC socket event listeners with null checks
  useEffect(() => {
    if (!socket) return;

    const handleCallIceCandidate = (data: any) => {
      if (!currentCallIdRef.current) {
        console.log('❌ Cannot send ICE candidate: No active call');
        return;
      }
      
      if (currentCallIdRef.current === data.callId) {
        console.log('📨 Received ICE candidate for call:', data.callId);
        webRTCManager.addIceCandidate(data.candidate);
      }
    };

    const handleCallOffer = async (data: any) => {
      if (!currentCallIdRef.current) {
        console.log('❌ Cannot handle offer: No active call');
        return;
      }
      
      if (currentCallIdRef.current === data.callId) {
        await handleIncomingOffer(data.offer);
      }
    };

    const handleCallAnswer = async (data: any) => {
      if (!currentCallIdRef.current) {
        console.log('❌ Cannot handle answer: No active call');
        return;
      }
      
      if (currentCallIdRef.current === data.callId) {
        await handleIncomingAnswer(data.answer);
      }
    };

    socket.on(CALL_ICE_CANDIDATE, handleCallIceCandidate);
    socket.on(CALL_OFFER, handleCallOffer);
    socket.on(CALL_ANSWER, handleCallAnswer);

    return () => {
      socket.off(CALL_ICE_CANDIDATE, handleCallIceCandidate);
      socket.off(CALL_OFFER, handleCallOffer);
      socket.off(CALL_ANSWER, handleCallAnswer);
    };
  }, [socket]);

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

  const handleSendMessage = (text: string, messageAttachments?: any[], voiceMessages?: any[]) => {
    if (!text.trim() && (!messageAttachments || messageAttachments.length === 0) && (!voiceMessages || voiceMessages.length === 0)) return;

    const message: Message = {
      _id: `msg${Date.now()}`,
      messageId: `msg${Date.now()}`,
      content: text,
      sender: {
        _id: actualUser._id,
        name: actualUser.name,
        email: actualUser.email,
        avatar: actualUser?.profilePic || "",
        profilePic: actualUser?.profilePic || "",
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
        isCurrentUser={item.sender._id === actualUser._id}
        currentUser={actualUser}
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

  const showCallButtons = shouldShowCallButtons();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        chat={chat}
        onlineUsers={onlineUsers}
        currentUser={actualUser}
        onTogglePinned={() => setShowPinnedMessages(!showPinnedMessages)}
        onBack={onBack}
        onStartVoiceCall={() => startCall('voice')}
        onStartVideoCall={() => startCall('video')}
        isInCall={showCallScreen || isIncomingCall}
        showCallButtons={showCallButtons}
      />

      {/* Incoming Call Alert */}
      {isIncomingCall && currentCall && (
        <View style={styles.incomingCallContainer}>
          <View style={styles.incomingCallContent}>
            <Text style={styles.incomingCallText}>
              Incoming {currentCall.type} call from {currentCall.caller.name}
            </Text>
            <View style={styles.incomingCallButtons}>
              <TouchableOpacity
                style={[styles.callButton, styles.rejectButton]}
                onPress={rejectCall}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callButton, styles.acceptButton]}
                onPress={acceptCall}
              >
                <Ionicons name="call" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Call Screen Modal */}
      <Modal
        visible={showCallScreen}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
      >
        {currentCall && (
          <CallScreen
            callData={currentCall}
            currentUser={actualUser}
            onEndCall={endCall}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onSwitchCamera={switchCamera}
            isAudioMuted={isAudioMuted}
            isVideoDisabled={isVideoDisabled}
          />
        )}
      </Modal>

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
  incomingCallContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  incomingCallContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  incomingCallText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  incomingCallButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  callButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4cd964',
  },
  rejectButton: {
    backgroundColor: '#ff3b30',
  },
});

export default ChatWindow;