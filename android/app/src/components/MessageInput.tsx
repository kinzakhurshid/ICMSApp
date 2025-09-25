import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Animated,
  Easing,
  Text,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Smile, Send } from 'lucide-react-native';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

// Import the new components
import VoiceRecorder from './VoiceRecorder';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import FileUploadHandler from './FileUploadHandler';
import EmojiPicker from './EmojiPicker';

// Types
export interface Attachment {
  public_id: string;
  url: string;
  originalName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  size?: number;
  thumbnail?: string;
}

interface VoiceMessageData {
  uri: string;
  duration: number;
  waveform?: number[];
  id: string;
}

interface MessageInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: (text: string, attachments?: Attachment[], voiceMessages?: VoiceMessageData[]) => void;
  onAttachmentsUpload?: (attachments: Attachment[]) => void;
  chatId: string;
  typing?: boolean;
  uploading?: boolean;
  style?: any;
}

// File utility functions (export these)
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getFileType = (fileName: string, mimeType?: string): Attachment['fileType'] => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType?.startsWith('audio/')) return 'audio';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
  if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension || '')) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) return 'document';
  
  return 'other';
};

// File size validation
export const validateFileSize = (fileSize: number, maxSizeMB = 20): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

// Main MessageInput Component
const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  onAttachmentsUpload,
  chatId,
  typing = false,
  uploading = false,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessageData[]>([]);
  const { callApi } = useAxios();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const token = useSelector((state: RootState) => state.user);

  const handleVoiceRecordingComplete = async (audioData: {
    uri: string;
    duration: number;
    waveform?: number[];
  }) => {
    try {
      // Add the voice message to the list
      const voiceMessage: VoiceMessageData = {
        ...audioData,
        id: `voice-${Date.now()}`,
      };
      
      setVoiceMessages(prev => [...prev, voiceMessage]);
      setShowVoiceRecorder(false);
      
    } catch (error) {
      console.error('Error handling voice recording:', error);
      Alert.alert('Error', 'Failed to process voice message. Please try again.');
    }
  };

  const handleVoiceRecordingCancel = () => {
    setShowVoiceRecorder(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    const newText = value + emoji;
    onChangeText(newText);
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setShowEmojiPicker(true);
      Keyboard.dismiss();
    }
  };

  const handleFilesSelected = (files: any[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleVoiceRecord = () => {
    setShowVoiceRecorder(true);
    Keyboard.dismiss();
  };

  const removeVoiceMessage = (id: string) => {
    setVoiceMessages(prev => prev.filter(vm => vm.id !== id));
  };

  const uploadFiles = async (filesToUpload: any[]) => {
    setIsUploading(true);
    const uploadedAttachments: Attachment[] = [];
    
    for (const fileData of filesToUpload) {
      try {
        if (!fileData.file) continue;
        
        // Check file size before uploading (client-side validation)
        const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
        if (fileData.file.size > MAX_FILE_SIZE) {
          Alert.alert(
            'File Too Large',
            `The file "${fileData.file.name}" exceeds the 20MB size limit.`,
            [{ text: 'OK' }]
          );
          setSelectedFiles(prev => prev.map(f => 
            f.id === fileData.id ? {...f, status: 'error'} : f
          ));
          continue;
        }
        
        // Update file status to uploading
        setSelectedFiles(prev => prev.map(f => 
            f.id === fileData.id ? {...f, status: 'uploading'} : f
        ));
        
        const formData = new FormData();
        formData.append('attachment', {
          uri: fileData.file.uri,
          name: fileData.file.name,
          type: fileData.file.type,
        });
        formData.append('chatId', chatId);
        
        const response = await callApi({
          method: 'POST',
          url: '/chats/sendAttachments',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setSelectedFiles(prev => prev.map(f => 
              f.id === fileData.id ? {...f, uploadProgress: progress} : f
            ));
          },
        });
        
        // Improved response handling
        let fileUrl = '';
        let publicId = '';
        let thumbnailUrl = '';

        // Try different possible response structures
        if (response.data) {
          // Handle case where response is wrapped in data property
          fileUrl = response.data.fileUrl || response.data.url || '';
          publicId = response.data.public_id || response.data.publicId || '';
          thumbnailUrl = response.data.thumbnailUrl || response.data.thumbnail || '';
        } else {
          // Handle direct response
          fileUrl = response.fileUrl || response.url || '';
          publicId = response.public_id || response.publicId || '';
          thumbnailUrl = response.thumbnailUrl || response.thumbnail || '';
        }

        if (fileUrl) {
          const uploadedFile: Attachment = {
            public_id: publicId || `file_${Date.now()}`,
            url: fileUrl,
            originalName: fileData.file.name,
            fileType: getFileType(fileData.file.name, fileData.file.type),
            size: fileData.file.size,
            thumbnail: thumbnailUrl,
          };
          
          // Update file status to completed
          setSelectedFiles(prev => prev.map(f => 
            f.id === fileData.id ? {...f, status: 'completed', uploadProgress: 100, attachment: uploadedFile} : f
          ));
          
          uploadedAttachments.push(uploadedFile);
        } else {
          console.error('Unexpected server response structure:', response);
          throw new Error('Server response missing required file URL');
        }
        
      } catch (error: any) {
        console.error('Error uploading file:', error);
        
        let errorMessage = 'Failed to upload file';
        if (error.response?.status === 413) {
          errorMessage = 'File is too large. Maximum size is 20MB.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Upload Error', errorMessage);
        
        setSelectedFiles(prev => prev.map(f => 
          f.id === fileData.id ? {...f, status: 'error'} : f
        ));
      }
    }
    
    // Update attachments with all uploaded files
    const newAttachments = [...attachments, ...uploadedAttachments];
    setAttachments(newAttachments);
    
    if (onAttachmentsUpload && uploadedAttachments.length > 0) {
      onAttachmentsUpload(newAttachments);
    }
    
    setIsUploading(false);
    return uploadedAttachments;
  };

  const handleSend = async () => {
    if (value.trim() || selectedFiles.length > 0 || voiceMessages.length > 0) {
      try {
        // Upload files first if any
        let uploadedAttachments: Attachment[] = [];
        if (selectedFiles.length > 0) {
          setIsUploading(true);
          uploadedAttachments = await uploadFiles(selectedFiles);
        }
        
        // Send message with text, attachments, and voice messages
        onSend(value, uploadedAttachments, voiceMessages);
        
        // Reset input and states
        onChangeText('');
        setAttachments([]);
        setSelectedFiles([]);
        setVoiceMessages([]);
        
        if (Platform.OS === 'ios') {
          Keyboard.dismiss();
        }
        
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setShowEmojiPicker(false);
        setShowVoiceRecorder(false);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showEmojiPicker ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showEmojiPicker]);

  const canSend = value.trim().length > 0 || selectedFiles.length > 0 || voiceMessages.length > 0;
  const isSending = isUploading || uploading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ 
        ios: 0, 
        android: StatusBar.currentHeight 
      })}
      style={[styles.keyboardAvoid, style]}
    >
      <View style={styles.container}>
        <EmojiPicker
          visible={showEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          slideAnim={slideAnim}
        />
        
        {/* Voice recorder */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onRecordingCancel={handleVoiceRecordingCancel}
            chatId={chatId}
          />
        )}
        
        {/* Voice messages preview */}
        {voiceMessages.length > 0 && (
          <View style={styles.voiceMessagesContainer}>
            <Text style={styles.voiceMessagesTitle}>Voice Messages ({voiceMessages.length})</Text>
            {voiceMessages.map((voiceMsg) => (
              <VoiceMessagePlayer
                key={voiceMsg.id}
                voiceMessage={voiceMsg}
                onRemove={() => removeVoiceMessage(voiceMsg.id)}
              />
            ))}
          </View>
        )}

        {/* Attachment previews */}
        {selectedFiles.length > 0 && (
          <View style={styles.attachmentsPreviewContainer}>
            <View style={styles.attachmentsPreview}>
              <Text style={styles.attachmentsTitle}>Attachments ({selectedFiles.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.attachmentsScroll}
                contentContainerStyle={styles.attachmentsContent}
              >
                {selectedFiles.map((fileData, index) => {
                  if (!fileData.file) return null;
                  
                  return (
                    <View key={fileData.id} style={styles.attachmentPreviewItem}>
                      <View style={styles.attachmentPreviewWrapper}>
                        <TouchableOpacity 
                          onPress={() => {
                            const newFiles = [...selectedFiles];
                            newFiles.splice(index, 1);
                            setSelectedFiles(newFiles);
                          }}
                          style={styles.attachmentRemoveButton}
                        >
                          <Text style={{color: 'white', fontSize: 12}}>X</Text>
                        </TouchableOpacity>
                        
                        {fileData.file.type?.startsWith('image/') ? (
                          <Image 
                            source={{ uri: fileData.file.uri }} 
                            style={styles.attachmentImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.attachmentPreviewInfo}>
                            <Text 
                              style={styles.attachmentPreviewName}
                              numberOfLines={1}
                              ellipsizeMode="middle">
                              {fileData.file.name || 'Unknown file'}
                            </Text>
                            {fileData.file.size && (
                              <Text style={styles.attachmentPreviewSize}>
                                {formatFileSize(fileData.file.size)}
                              </Text>
                            )}
                            <Text style={[
                              styles.statusText,
                              fileData.status === 'error' && { color: '#ef4444' },
                              fileData.status === 'completed' && { color: '#10b981' }
                            ]}>
                              {fileData.status === 'uploading' 
                                ? `Uploading... ${fileData.uploadProgress}%` 
                                : fileData.status === 'completed' 
                                  ? 'Ready to send' 
                                  : fileData.status === 'error' 
                                    ? 'Upload failed' 
                                    : 'Ready to send'
                              }
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
        
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
          <FileUploadHandler
            onFilesSelected={handleFilesSelected}
            onVoiceRecord={handleVoiceRecord}
            uploading={isSending}
          />

          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isSending}
          />

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleEmojiPicker}
              disabled={isSending}
            >
              <Smile size={20} color={showEmojiPicker ? "#3b82f6" : "#6b7280"} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton, 
                (!canSend || isSending) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!canSend || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#9ca3af" />
              ) : (
                <Send size={20} color={canSend ? '#ffffff' : '#9ca3af'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    position: 'relative',
    width: '100%',
  },
  container: { 
    backgroundColor: '#f3f4f6', 
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  // Attachment preview styles
  attachmentsPreviewContainer: {
    marginBottom: 12,
  },
  attachmentsPreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  voiceMessagesContainer: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  voiceMessagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  attachmentsScroll: {
    flexGrow: 0,
  },
  attachmentsContent: {
    paddingHorizontal: 4,
  },
  attachmentPreviewItem: {
    marginRight: 12,
  },
  attachmentPreviewWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentPreviewInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
  },
  attachmentPreviewName: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  attachmentPreviewSize: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  attachmentRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Input styles
  inputContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#e5e7eb', 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    minHeight: 50,
  },
  inputContainerFocused: { 
    borderColor: '#9ca3af', 
    backgroundColor: '#fff' 
  },
  textInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#374151', 
    maxHeight: 120, 
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? 6 : 0,
    minHeight: 20,
  },
  rightIcons: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  iconButton: { 
    padding: 6, 
    borderRadius: 6 
  },
  sendButton: { 
    backgroundColor: '#3b82f6', 
    padding: 8, 
    borderRadius: 20,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { 
    backgroundColor: '#e5e7eb' 
  },
});

export default MessageInput;