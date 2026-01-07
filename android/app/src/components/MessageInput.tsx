import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Image,
  Alert,
  Platform,
  Keyboard,
  Modal,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import { uploadAttachment } from '../Services/api';
import { useSocket } from '../Context/SocketContext';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import AttachmentPreview from './AttachmentPreview';
import FileTypeSelector from './FileTypeSelector';
import { User, Message, MentionSuggestion } from '../types/chattypes';
import VoiceMessageRecorder from './VoiceMessageRecorder';
import DocumentPicker from 'react-native-document-picker';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any[], replyTo?: string, mentions?: string[]) => void;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  chatId: string;
  members: User[];
  disabled?: boolean;
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
  '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
  '😾', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴',
  '👵', '👱', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳', '👨‍🦲',
  '👩‍🦲', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹',
  '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶',
  '🏃', '💃', '🕺', '👯', '🧖', '🧗', '🤺', '🏇', '⛷️', '🏂',
  '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼',
  '🤽', '🤾', '🤹', '🧘', '🛀', '🛌', '👭', '👫', '👬', '💏',
  '💑', '👪', '🗣️', '👤', '👥', '👣', '🐵', '🐒', '🦍', '🐶',
  '🐕', '🐩', '🐺', '🦊', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆',
  '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷',
  '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🐘',
  '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔',
  '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦡', '🐾', '🦃', '🐔',
  '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦉',
  '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
  '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖',
  '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
  '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏',
  '🦛', '🐪', '🐫', '🦙', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏',
  '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜',
  '🦢', '🦩', '🕊️', '🐇', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉',
  '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀',
  '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷',
  '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜',
  '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙',
  '⭐', '🌟', '💫', '✨', '☄️', '☀️', '🌤️', '⛅', '🌥️', '☁️',
  '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨',
  '💧', '💦', '☔', '☂️', '🌊', '🌫️', '🍏', '🍎', '🍐', '🍊',
  '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍',
  '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽',
  '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯',
  '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖',
  '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯',
  '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟',
  '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧',
  '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',
  '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵',
  '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹',
  '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'
];

const MessageInput: React.FC<{
  onSendMessage: (content: string, attachments?: any[], replyToId?: string, mentions?: string[]) => void;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  chatId: string;
  members: User[];
  disabled?: boolean;
}> = ({
  onSendMessage,
  onTyping,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  chatId,
  members,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  
  // Update message when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || '');
    } else {
      setMessage('');
    }
  }, [editingMessage]);

  // Request microphone permission for voice recording
  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record voice messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const mentionListRef = useRef<FlatList>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [showFileTypeSelector, setShowFileTypeSelector] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { socket } = useSocket();
  const token = useSelector((state: RootState) => state.user.token);

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


  const filteredMembers = useMemo(() => {
    return members.filter(member =>
      member && member.name && 
      (member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
       member.email?.toLowerCase().includes(mentionQuery.toLowerCase()))
    );
  }, [members, mentionQuery]);

  // Reset selected index when filtered members change
  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [filteredMembers.length]);
  

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    // Handle mentions - improved regex to match @ followed by any characters
    const mentionMatch = text.match(/@([^\s@]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionPicker(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionPicker(false);
      setSelectedMentionIndex(0);
    }

    // Handle typing indicator
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      onTyping?.(true);
      socket?.emit('START_TYPING', { chatId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
      socket?.emit('STOP_TYPING', { chatId });
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;

    // Extract mentions
    const mentionMatches = message.match(/@(\w+)/g);
    const mentionedUserIds = mentionMatches?.map(match => {
      const username = match.substring(1);
      const user = members.find(m => m.name.toLowerCase() === username.toLowerCase());
      return user?._id;
    }).filter((id): id is string => Boolean(id)) || [];

    onSendMessage(
      message.trim(),
      attachments,
      replyTo?._id,
      mentionedUserIds
    );

        setMessage('');
        setAttachments([]);
        setShowEmojiPicker(false);
        setShowMentionPicker(false);
        setIsTyping(false);
        onTyping?.(false);
        socket?.emit('STOP_TYPING', { chatId });
        
        // Clear reply state
        onCancelReply?.();
        
        // Clear edit state
        onCancelEdit?.();
  };

      const handleVoiceMessage = async (audioUrl: string, duration: number) => {
        // Add voice message to pending attachments for preview
        const timestamp = Date.now();
        
        // Determine file type from the actual file extension
        let fileType = 'audio/mp4'; // Default to MP4 since library creates MP4
        let fileExtension = 'mp4';
        
        if (audioUrl) {
          const extension = audioUrl.split('.').pop()?.toLowerCase();
          if (extension === 'mp3') {
            fileType = 'audio/mp3';
            fileExtension = 'mp3';
          } else if (extension === 'wav') {
            fileType = 'audio/wav';
            fileExtension = 'wav';
          } else if (extension === 'aac') {
            fileType = 'audio/aac';
            fileExtension = 'aac';
          } else if (extension === 'm4a') {
            fileType = 'audio/m4a';
            fileExtension = 'm4a';
          } else if (extension === 'mp4') {
            fileType = 'audio/mp4';
            fileExtension = 'mp4';
          }
          // Default to mp4 since that's what the library creates
        }

        const voiceAttachment = {
          uri: audioUrl,
          type: fileType,
          name: `${timestamp}-voice-message.${fileExtension}`,
          size: 0,
          id: Date.now() + Math.random(),
          duration: duration,
          originalName: `Voice Message ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
        };

        setPendingAttachments(prev => [...prev, voiceAttachment]);
        setShowAttachmentPreview(true);
    setShowVoiceRecorder(false);
        onCancelReply?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleMentionSelect = (member: User) => {
    // Replace the @mention part with @username
    const newMessage = message.replace(/@[^\s@]*$/, `@${member.name} `);
    setMessage(newMessage);
    setShowMentionPicker(false);
    setMentionQuery('');
    setSelectedMentionIndex(0);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation for mentions
  const handleKeyPress = (e: any) => {
    if (!showMentionPicker || filteredMembers.length === 0) return;

    if (e.nativeEvent.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (selectedMentionIndex + 1) % filteredMembers.length;
      setSelectedMentionIndex(nextIndex);
      // Scroll to selected item
      setTimeout(() => {
        mentionListRef.current?.scrollToIndex({ 
          index: nextIndex, 
          animated: true,
          viewPosition: 0.5
        });
      }, 100);
    } else if (e.nativeEvent.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = selectedMentionIndex <= 0 
        ? filteredMembers.length - 1 
        : selectedMentionIndex - 1;
      setSelectedMentionIndex(prevIndex);
      // Scroll to selected item
      setTimeout(() => {
        mentionListRef.current?.scrollToIndex({ 
          index: prevIndex, 
          animated: true,
          viewPosition: 0.5
        });
      }, 100);
    } else if (e.nativeEvent.key === 'Enter' || e.nativeEvent.key === 'Tab') {
      if (filteredMembers[selectedMentionIndex]) {
        e.preventDefault();
        handleMentionSelect(filteredMembers[selectedMentionIndex]);
      }
    } else if (e.nativeEvent.key === 'Escape') {
      setShowMentionPicker(false);
      setSelectedMentionIndex(0);
    }
  };

  const handleAttachment = () => {
    setShowFileTypeSelector(true);
  };


  const handleFileTypeSelect = (type: 'image' | 'video' | 'document' | 'camera') => {
    switch (type) {
      case 'camera':
        openCamera();
        break;
      case 'image':
        openGallery();
        break;
      case 'video':
        openVideoPicker();
        break;
      case 'document':
        openDocumentPicker();
        break;
    }
  };

  const openCamera = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      quality: 0.8,
    }).then(handleImageResponse).catch(() => {});
  };

  const openGallery = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      quality: 0.8,
      multiple: true,
      maxFiles: 5,
    }).then(handleImageResponse).catch(() => {});
  };

  const openVideoPicker = () => {
    ImagePicker.openPicker({
      mediaType: 'video',
      quality: 0.8,
      multiple: true,
      maxFiles: 3,
    }).then(handleImageResponse).catch(() => {});
  };

  const openDocumentPicker = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      if (results && results.length > 0) {
        const fileDataArray = results.map((file: any) => ({
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'Document',
          size: file.size || 0,
          id: Date.now() + Math.random()
        }));
        
        setPendingAttachments(prev => [...prev, ...fileDataArray]);
        setShowAttachmentPreview(true);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        } else {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to select document');
      }
    }
  };

  const handleImageResponse = async (response: any) => {
    if (!response || response.didCancel) return;

    // Handle single file response
    const files = Array.isArray(response) ? response : [response];
    
    // Prepare file data for preview (without uploading yet)
    const fileDataArray = files.map((file: any) => {
      const uri = file.path || file.uri;
      const type = file.mime || file.type || 'image/jpeg';
      
      // Safe file name extraction
      let name = file.filename || file.name;
      if (!name && uri) {
        try {
          name = uri.split('/').pop() || 'file.jpg';
        } catch (error) {
          name = `file_${Date.now()}.jpg`;
        }
      }
      if (!name) {
        name = `file_${Date.now()}.jpg`;
      }

      return {
        uri,
        type,
        name,
        size: file.size || 0,
        id: Date.now() + Math.random() // Unique ID for each file
      };
    });

    // Add to pending attachments and show preview
    setPendingAttachments(prev => [...prev, ...fileDataArray]);
    setShowAttachmentPreview(true);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
    if (pendingAttachments.length === 1) {
      setShowAttachmentPreview(false);
    }
  };

  const handleSendAttachments = async () => {
    if (pendingAttachments.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles = await Promise.all(
        pendingAttachments.map(async (fileData: any) => {
          const uploadResponse = await uploadAttachment(chatId, fileData, token!);
          return uploadResponse;
        })
      );

      // Send message with uploaded attachments
      onSendMessage(message.trim(), uploadedFiles, replyTo?._id, []);
      
      // Clear pending attachments and close preview
      setPendingAttachments([]);
      setShowAttachmentPreview(false);
      setMessage('');
      } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload attachments');
      } finally {
        setIsUploading(false);
      }
  };

  const handleCancelAttachments = () => {
    setPendingAttachments([]);
    setShowAttachmentPreview(false);
  };

  const renderAttachment = (attachment: any, index: number) => (
    <View key={index} style={styles.attachmentPreview}>
      {attachment.fileType?.startsWith('image/') ? (
        <Image source={{ uri: attachment.url }} style={styles.attachmentImage} />
      ) : (
        <View style={styles.filePreview}>
          <Ionicons name="document" size={20} color="#666" />
          <Text style={styles.fileName} numberOfLines={1}>
            {attachment.fileName || 'File'}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.removeAttachment}
        onPress={() => removeAttachment(index)}
      >
        <Ionicons name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderMentionItem = ({ item, index }: { item: User; index: number }) => {
    if (!item || !item.name) return null;
    
    const isSelected = index === selectedMentionIndex;
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <TouchableOpacity
        style={[
          styles.mentionItem,
          isSelected && styles.mentionItemSelected
        ]}
        onPress={() => handleMentionSelect(item)}
        activeOpacity={0.7}
      >
        {item.avatar || item.profilePic ? (
          <Image
            source={{ uri: item.avatar || item.profilePic }}
            style={styles.mentionAvatar}
          />
        ) : (
          <View style={[styles.mentionAvatar, styles.mentionAvatarPlaceholder]}>
            <Text style={styles.mentionAvatarText}>
              {getInitials(item.name)}
            </Text>
          </View>
        )}
        <View style={styles.mentionInfo}>
          <Text style={styles.mentionName}>{item.name}</Text>
          {item.email && (
            <Text style={styles.mentionEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmojiItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => handleEmojiSelect(item)}
    >
      <Text style={styles.emojiText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
      <View style={[styles.container, { marginBottom: keyboardHeight > 0 ? keyboardHeight - 50 : 0 }]}>
      {/* Reply Preview */}
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyIndicator} />
          <View style={styles.replyContent}>
            <View style={styles.replyHeader}>
              <Ionicons name="arrow-undo" size={16} color="#FF6B35" />
              <Text style={styles.replySender}>Replying to {replyTo.sender.name}</Text>
            </View>
            <Text style={styles.replyText} numberOfLines={2}>
              {replyTo.content || 'Attachment'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onCancelReply} 
            style={styles.cancelReply}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Preview */}
      {editingMessage && (
        <View style={styles.editPreview}>
          <View style={styles.editIndicator} />
          <View style={styles.editContent}>
            <View style={styles.editHeader}>
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
              <Text style={styles.editSender}>Editing message</Text>
            </View>
            <Text style={styles.editText} numberOfLines={2}>
              {editingMessage.content || 'Attachment'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onCancelEdit} 
            style={styles.cancelReply}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {attachments.map(renderAttachment)}
        </View>
      )}

      {/* Mention Picker */}
      {showMentionPicker && filteredMembers.length > 0 && (
        <View style={styles.mentionPicker}>
          <View style={styles.mentionPickerHeader}>
            <Text style={styles.mentionPickerTitle}>
              Mention someone ({filteredMembers.length})
            </Text>
            <Text style={styles.mentionPickerHint}>
              ↑↓ to navigate • Enter/Tab to select
            </Text>
          </View>
          <FlatList
            ref={mentionListRef}
            data={filteredMembers}
            keyExtractor={(item) => item._id}
            renderItem={renderMentionItem}
            style={styles.mentionList}
            keyboardShouldPersistTaps="handled"
            getItemLayout={(data, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
            initialScrollIndex={0}
          />
        </View>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <View style={styles.emojiPicker}>
          <FlatList
            data={EMOJIS}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderEmojiItem}
            numColumns={8}
            style={styles.emojiList}
            keyboardShouldPersistTaps="handled"
          />
          </View>
        )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={handleAttachment}
          disabled={disabled || isUploading}
        >
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>

                        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={async () => {
            const hasPermission = await requestMicrophonePermission();
            if (hasPermission) {
              setShowVoiceRecorder(true);
            } else {
              Alert.alert(
                'Permission Required',
                'Microphone permission is required to record voice messages. Please enable it in app settings.',
                [{ text: 'OK' }]
              );
            }
          }}
          disabled={disabled}
        >
          <Ionicons name="mic" size={24} color="#FF6B35" />
                        </TouchableOpacity>
                        
        <View style={styles.textInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Type a message..."
            value={message}
            onChangeText={handleTextChange}
            onKeyPress={handleKeyPress}
            multiline
            maxLength={1000}
            editable={!disabled}
            submitBehavior="blurAndSubmit"
          />
        </View>

            <TouchableOpacity
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
        >
          <Ionicons name="happy-outline" size={24} color="#FF6B35" />
            </TouchableOpacity>


            <TouchableOpacity
              style={[
                styles.sendButton, 
            (!message.trim() && attachments.length === 0 && pendingAttachments.length === 0) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0 && pendingAttachments.length === 0) || isUploading}
            >
          {isUploading ? (
            <Ionicons name="hourglass-outline" size={20} color="#fff" />
              ) : (
            <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
      </View>

      {/* Voice Recorder Modal */}
      <Modal
        visible={showVoiceRecorder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoiceRecorder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <VoiceMessageRecorder
              onSend={handleVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Attachment Preview Modal */}
      <Modal
        visible={showAttachmentPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelAttachments}
      >
        <View style={styles.modalOverlay}>
          <AttachmentPreview
            attachments={pendingAttachments}
            onRemoveAttachment={removePendingAttachment}
            onSendAttachments={handleSendAttachments}
            onCancelAttachments={handleCancelAttachments}
            isUploading={isUploading}
          />
        </View>
      </Modal>

      {/* File Type Selector Modal */}
      <FileTypeSelector
        visible={showFileTypeSelector}
        onClose={() => setShowFileTypeSelector(false)}
        onSelectType={handleFileTypeSelect}
      />
      </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 0,
  },
  replyIndicator: {
    width: 4,
    height: 40,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
    marginRight: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replySender: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 6,
  },
  replyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  editPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 0,
  },
  editIndicator: {
    width: 4,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginRight: 12,
  },
  editContent: {
    flex: 1,
    marginRight: 8,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  editSender: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  editText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
  },
  cancelReply: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  attachmentPreview: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  filePreview: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  removeAttachment: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionPicker: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mentionPickerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  mentionPickerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  mentionPickerHint: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  mentionList: {
    maxHeight: 150,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mentionItemSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  mentionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  mentionAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  mentionAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  mentionEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  emojiPicker: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emojiList: {
    maxHeight: 200,
  },
  emojiItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'row', 
    alignItems: 'flex-end',
    padding: 12,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  voiceButton: {
    padding: 8,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: { 
    fontSize: 16, 
    lineHeight: 20,
    padding: 0,
    color: '#000000',
  },
  emojiButton: {
    padding: 8,
    marginRight: 8,
  },
  sendButton: { 
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { 
    backgroundColor: '#ccc',
  },
});

export default MessageInput;