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
  PermissionsAndroid,
  Linking,
  Image,
  Vibration,
  AppState,
} from 'react-native';
import { Paperclip, Smile, Send, X, FileText, Image as ImageIcon, Video, Headphones, Mic, MicOff, Play, Square } from 'lucide-react-native';
import DocumentPicker, { types } from 'react-native-document-picker';
import ImagePicker from 'react-native-image-crop-picker';
import useAxios from '../hooks/useAxios';
import { AxiosProgressEvent } from 'axios';
import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import Sound from 'react-native-sound';
// Types
export interface Attachment {
  public_id: string;
  url: string;
  originalName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  size?: number;
  thumbnail?: string;
}
interface VoiceMessagePlayback {
  uri: string;
  isPlaying: boolean;
  sound: Sound | null;
  duration: number;
  currentPosition: number;
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

// Emojis
const EMOJI_CATEGORIES = [
  {
    title: 'Smileys & People',
    data: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇']
  },
  {
    title: 'Animals & Nature',
    data: ['🐵', '🐶', '🐺', '🐱', '🦁', '🐯', '🐰', '🐻', '🐼', '🐨']
  },
  {
    title: 'Food & Drink',
    data: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈']
  },
];

// File utility functions
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

// Voice recording constants
const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds

// Voice Recording Component
interface VoiceRecorderProps {
  onRecordingComplete: (audioData: {
    uri: string;
    duration: number;
    waveform?: number[];
  }) => void;
  onRecordingCancel: () => void;
  chatId: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onRecordingComplete, 
  onRecordingCancel, 
  chatId 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const [audioUri, setAudioUri] = useState<string>('');

  const waveformAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permissions
      let microphoneGranted = false;
      
      if (Platform.OS === 'android') {
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
          microphoneGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.warn('Microphone permission error:', err);
          microphoneGranted = false;
        }
      } else {
        // For iOS, we assume permission is granted or will be handled by system
        microphoneGranted = true;
      }

      if (!microphoneGranted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record voice messages.');
        return;
      }

      // Start recording logic here
      // For now, we'll simulate recording
      setIsRecording(true);
      
      // Generate a temporary URI for the audio file
      const tempUri = `file:///temp/voice_message_${Date.now()}.m4a`;
      setAudioUri(tempUri);
      
      // Start timer
      let time = 0;
      const timer = setInterval(() => {
        time += 1;
        setRecordingTime(time);
        
        // Generate random waveform data for visualization
        if (time % 0.5 === 0) {
          setRecordingWaveform(prev => [...prev.slice(-50), Math.random() * 30 + 10]);
        }

        if (time >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 1000);

      setRecordingTimer(timer);

      // Animate waveform
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveformAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      // In a real implementation, you would stop the actual recording here
      // and get the audio file URI
      
      setIsRecording(false);
      
      // Return the audio data
      onRecordingComplete({
        uri: audioUri,
        duration: recordingTime,
        waveform: recordingWaveform
      });
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimer) {
      clearInterval(recordingTimer);
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setRecordingWaveform([]);
    waveformAnim.stopAnimation();
    onRecordingCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={voiceStyles.container}>
      <View style={voiceStyles.header}>
        <Text style={voiceStyles.title}>Voice Message</Text>
        <TouchableOpacity onPress={cancelRecording} style={voiceStyles.closeButton}>
          <X size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={voiceStyles.waveformContainer}>
        {recordingWaveform.map((height, index) => (
          <Animated.View
            key={index}
            style={[
              voiceStyles.waveformBar,
              {
                height: height,
                opacity: waveformAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ]}
          />
        ))}
      </View>

      <View style={voiceStyles.controls}>
        <Text style={voiceStyles.timeText}>
          {formatTime(recordingTime)}
        </Text>
        
        {isRecording ? (
          <TouchableOpacity onPress={stopRecording} style={voiceStyles.stopButton}>
            <Square size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startRecording} style={voiceStyles.recordButton}>
            <Mic size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {isRecording && (
          <TouchableOpacity onPress={cancelRecording} style={voiceStyles.cancelButton}>
            <X size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const voiceStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 16,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    minWidth: 50,
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: '#ef4444',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: 12,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

// File Upload Handler Component
interface FileUploadHandlerProps {
  chatId: string;
  onAttachmentsChange: (attachments: Attachment[]) => void;
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  uploading?: boolean;
  onUploadStatusChange?: (uploading: boolean) => void;
  onFilesSelected: (files: FileWithId[]) => void;
  onUploadFiles: (files: FileWithId[]) => Promise<void>;
  selectedFiles: FileWithId[];
  onVoiceRecord: () => void;
}

interface FileWithId {
  id: string;
  file: any;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  attachment?: Attachment;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({ 
  chatId,
  onAttachmentsChange,
  attachments,
  onRemoveAttachment,
  uploading = false,
  onUploadStatusChange,
  onFilesSelected,
  onUploadFiles,
  selectedFiles,
  onVoiceRecord,
}) => {
  const [showFileSelector, setShowFileSelector] = useState(false);

  const makeFileLikeObject = (file: { uri: string; name: string; type: string; size: number }) => {
    const now = Date.now();
    return { ...file, lastModified: now, lastModifiedDate: new Date(now), webkitRelativePath: "" };
  };

  const safeAddFiles = (newFiles: FileWithId[]) => {
    onFilesSelected([...selectedFiles, ...newFiles]);
  };

  const pickImages = async () => {
    try {
      const selected = await ImagePicker.openPicker({ multiple: true, mediaType: 'photo' });
      
      // Filter out files that are too large
      const validFiles = selected.filter(img => validateFileSize(img.size, 20));
      
      if (validFiles.length !== selected.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }
      
      const files = validFiles.map((img, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: img.path,
          name: img.filename || `image-${i}.jpg`,
          type: img.mime || 'image/jpeg',
          size: img.size,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      safeAddFiles(files);
    } catch (err: any) {
      if (err.code !== 'E_PICKER_CANCELLED') console.warn('Image picker error:', err);
    }
  };

  const pickVideos = async () => {
    try {
      const selected = await ImagePicker.openPicker({ multiple: true, mediaType: 'video' });
      
      // Filter out files that are too large
      const validFiles = selected.filter(video => validateFileSize(video.size, 20));
      
      if (validFiles.length !== selected.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }
      
      const files = validFiles.map((video, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: video.path,
          name: video.filename || `video-${i}.mp4`,
          type: video.mime || 'video/mp4',
          size: video.size,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      safeAddFiles(files);
    } catch (err: any) {
      if (err.code !== 'E_PICKER_CANCELLED') console.warn('Video picker error:', err);
    }
  };

  const pickDocuments = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [types.pdf, types.doc, types.docx, types.xls, types.xlsx, types.ppt, types.pptx, types.plainText],
        allowMultiSelection: true,
      });

      // Filter out files that are too large
      const validFiles = results.filter(file => validateFileSize(file.size || 0, 20));
      
      if (validFiles.length !== results.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }

      const files = validFiles.map((file, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: file.uri,
          name: file.name || `document-${i}`,
          type: file.type || 'application/octet-stream',
          size: file.size || 0,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      safeAddFiles(files);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) Alert.alert('Error', 'Failed to select document.');
    }
  };

  const pickAudio = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [types.audio, 'audio/mpeg', 'audio/wav', 'audio/x-m4a'],
        allowMultiSelection: true,
      });

      // Filter out files that are too large
      const validFiles = results.filter(file => validateFileSize(file.size || 0, 20));
      
      if (validFiles.length !== results.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }

      const files = validFiles.map((file, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: file.uri,
          name: file.name || `audio-${i}`,
          type: file.type || 'audio/mpeg',
          size: file.size || 0,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      safeAddFiles(files);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) Alert.alert('Error', 'Failed to select audio file.');
    }
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const permissions =
        Platform.Version >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            ]
          : [
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ];

      const result = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
    } catch (e) {
      console.warn('Permission error:', e);
      return false;
    }
  };

  const handleFileSelect = async (type: 'image' | 'video' | 'document' | 'audio') => {
    const hasPermission = Platform.OS === 'android' ? await requestAndroidPermissions() : true;
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant storage permissions in settings.');
      return;
    }

    if (type === 'image') await pickImages();
    else if (type === 'video') await pickVideos();
    else if (type === 'document') await pickDocuments();
    else if (type === 'audio') await pickAudio();

    setShowFileSelector(false);
  };

  return (
    <View style={fileUploadStyles.container}>
      {showFileSelector && (
        <View style={fileUploadStyles.selectorContainer}>
          <Text style={fileUploadStyles.selectorTitle}>Select File Type</Text>
          <View style={fileUploadStyles.selectorGrid}>
            {['image', 'video', 'document', 'audio'].map((type) => (
              <TouchableOpacity
                key={type}
                style={fileUploadStyles.selectorButton}
                onPress={() => handleFileSelect(type as any)}
              >
                {type === 'image' && <ImageIcon size={24} color="#3b82f6" />}
                {type === 'video' && <Video size={24} color="#3b82f6" />}
                {type === 'document' && <FileText size={24} color="#3b82f6" />}
                {type === 'audio' && <Headphones size={24} color="#3b82f6" />}
                <Text style={fileUploadStyles.selectorLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={fileUploadStyles.buttonsContainer}>
        <TouchableOpacity
          style={fileUploadStyles.attachButton}
          onPress={() => setShowFileSelector((p) => !p)}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator size="small" color="#6b7280" /> : <Paperclip size={20} color="#6b7280" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={fileUploadStyles.voiceButton}
          onPress={onVoiceRecord}
          disabled={uploading}
        >
          <Mic size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const fileUploadStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadContainer: {
    position: 'relative',
  },
  attachButton: {
    padding: 8,
    borderRadius: 6,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 6,
  },
  selectorContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  selectorButton: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});

interface VoiceMessageData {
  uri: string;
  duration: number;
  waveform?: number[];
  localUri?: string; // For local playback
}

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
  const [selectedFiles, setSelectedFiles] = useState<FileWithId[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessageData[]>([]);
  const { callApi } = useAxios();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const token = useSelector((state: RootState) => state.user);
  const [voiceMessagePlaybacks, setVoiceMessagePlaybacks] = useState<Record<string, VoiceMessagePlayback>>({});
  const [currentTimeIntervals, setCurrentTimeIntervals] = useState<Record<string, NodeJS.Timeout>>({});

  // Add useEffect for cleanup
  useEffect(() => {
    return () => {
      // Clean up all sound objects when component unmounts
      Object.values(voiceMessagePlaybacks).forEach(playback => {
        if (playback.sound) {
          playback.sound.release();
        }
      });
      
      // Clear all intervals
      Object.values(currentTimeIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  // Function to update current position for a voice message
  const updateCurrentPosition = (uri: string, sound: Sound) => {
    sound.getCurrentTime((seconds) => {
      setVoiceMessagePlaybacks(prev => ({
        ...prev,
        [uri]: {
          ...prev[uri],
          currentPosition: seconds
        }
      }));
    });
  };

  // Add this function to handle voice message playback
  const playVoiceMessage = async (voiceMessage: VoiceMessageData) => {
    try {
      // Check if we already have a sound object for this URI
      const existingPlayback = voiceMessagePlaybacks[voiceMessage.uri];
      
      if (existingPlayback && existingPlayback.isPlaying) {
        // If already playing, pause it
        existingPlayback.sound?.pause();
        
        // Clear the interval for updating current position
        if (currentTimeIntervals[voiceMessage.uri]) {
          clearInterval(currentTimeIntervals[voiceMessage.uri]);
          setCurrentTimeIntervals(prev => {
            const newIntervals = { ...prev };
            delete newIntervals[voiceMessage.uri];
            return newIntervals;
          });
        }
        
        setVoiceMessagePlaybacks(prev => ({
          ...prev,
          [voiceMessage.uri]: {
            ...existingPlayback,
            isPlaying: false
          }
        }));
        return;
      }
      
      // If we have a sound object but it's not playing, resume it
      if (existingPlayback && existingPlayback.sound) {
        existingPlayback.sound.play((success) => {
          if (success) {
            setVoiceMessagePlaybacks(prev => ({
              ...prev,
              [voiceMessage.uri]: {
                ...existingPlayback,
                isPlaying: false
              }
            }));
            
            // Clear the interval when playback completes
            if (currentTimeIntervals[voiceMessage.uri]) {
              clearInterval(currentTimeIntervals[voiceMessage.uri]);
              setCurrentTimeIntervals(prev => {
                const newIntervals = { ...prev };
                delete newIntervals[voiceMessage.uri];
                return newIntervals;
              });
            }
          } else {
            console.error('Playback failed');
          }
        });
        
        // Start updating current position every second
        const interval = setInterval(() => {
          if (existingPlayback.sound) {
            updateCurrentPosition(voiceMessage.uri, existingPlayback.sound);
          }
        }, 1000);
        
        setCurrentTimeIntervals(prev => ({
          ...prev,
          [voiceMessage.uri]: interval
        }));
        
        setVoiceMessagePlaybacks(prev => ({
          ...prev,
          [voiceMessage.uri]: {
            ...existingPlayback,
            isPlaying: true
          }
        }));
        return;
      }
      
      // Create a new sound object
      const sound = new Sound(voiceMessage.uri, '', (error) => {
        if (error) {
          console.error('Failed to load the sound', error);
          Alert.alert('Error', 'Failed to play voice message');
          return;
        }
        
        // Play the sound
        sound.play((success) => {
          if (success) {
            setVoiceMessagePlaybacks(prev => ({
              ...prev,
              [voiceMessage.uri]: {
                uri: voiceMessage.uri,
                isPlaying: false,
                sound: null,
                duration: sound.getDuration(),
                currentPosition: 0
              }
            }));
            
            // Clear the interval when playback completes
            if (currentTimeIntervals[voiceMessage.uri]) {
              clearInterval(currentTimeIntervals[voiceMessage.uri]);
              setCurrentTimeIntervals(prev => {
                const newIntervals = { ...prev };
                delete newIntervals[voiceMessage.uri];
                return newIntervals;
              });
            }
          } else {
            console.error('Playback failed');
          }
        });
        
        // Start updating current position every second
        const interval = setInterval(() => {
          updateCurrentPosition(voiceMessage.uri, sound);
        }, 1000);
        
        setCurrentTimeIntervals(prev => ({
          ...prev,
          [voiceMessage.uri]: interval
        }));
      });
      
      // Store the sound object
      setVoiceMessagePlaybacks(prev => ({
        ...prev,
        [voiceMessage.uri]: {
          uri: voiceMessage.uri,
          isPlaying: true,
          sound,
          duration: sound.getDuration(),
          currentPosition: 0
        }
      }));
      
    } catch (error) {
      console.error('Error playing voice message:', error);
      Alert.alert('Error', 'Failed to play voice message');
    }
  };

  // Retry upload function
  const retryUpload = async (fileId: string) => {
    const fileToRetry = selectedFiles.find(f => f.id === fileId);
    if (!fileToRetry) return;
    
    setSelectedFiles(prev => prev.map(f => 
      f.id === fileId ? {...f, status: 'pending', uploadProgress: 0} : f
    ));
    
    await uploadFiles([fileToRetry]);
  };

  const handleVoiceRecordingComplete = async (audioData: {
    uri: string;
    duration: number;
    waveform?: number[];
  }) => {
    try {
      // Add the voice message to the list
      const voiceMessage: VoiceMessageData = {
        ...audioData,
        localUri: audioData.uri // Store local URI for playback
      };
      
      setVoiceMessages(prev => [...prev, voiceMessage]);
      setShowVoiceRecorder(false);
      
      // Send the voice message immediately via socket
      // You'll need to implement your socket emission logic here
      // For example:
      // socket.emit('send-voice-message', {
      //   chatId,
      //   voiceMessage: {
      //     duration: voiceMessage.duration,
      //     waveform: voiceMessage.waveform,
      //     // You might need to convert the audio to a format suitable for transmission
      //   }
      // });
      
      // For now, we'll just show a success message
      Alert.alert('Voice Message', 'Voice message recorded successfully');
      
    } catch (error) {
      console.error('Error handling voice recording:', error);
      Alert.alert('Error', 'Failed to process voice message. Please try again.');
    }
  };

  const uploadFiles = async (filesToUpload: FileWithId[]) => {
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
        
        // Clean up voice message playbacks
        Object.values(voiceMessagePlaybacks).forEach(playback => {
          if (playback.sound) {
            playback.sound.release();
          }
        });
        setVoiceMessagePlaybacks({});
        
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

  const handleAttachmentsChange = (newAttachments: Attachment[]) => {
    setAttachments(newAttachments);
    
    if (onAttachmentsUpload && newAttachments.length > 0) {
      onAttachmentsUpload(newAttachments);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    // Also remove from selected files
    const attachmentToRemove = attachments[index];
    setSelectedFiles(prev => prev.filter(file => 
      file.attachment?.public_id !== attachmentToRemove.public_id
    ));
  };

  const handleUploadStatusChange = (uploading: boolean) => {
    setIsUploading(uploading);
  };

  const handleFilesSelected = (files: FileWithId[]) => {
    setSelectedFiles(files);
  };

  const handleVoiceRecord = () => {
    setShowVoiceRecorder(true);
    Keyboard.dismiss();
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

  const emojiPickerTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
  });

  const renderAttachmentIcon = (fileType: Attachment['fileType']) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon size={20} color="#3b82f6" />;
      case 'video':
        return <Video size={20} color="#3b82f6" />;
      case 'audio':
        return <Headphones size={20} color="#3b82f6" />;
      case 'document':
        return <FileText size={20} color="#3b82f6" />;
      default:
        return <FileText size={20} color="#3b82f6" />;
    }
  };

  const renderEmojiPicker = () => (
    <Animated.View
      style={[
        styles.emojiPicker,
        {
          transform: [{ translateY: emojiPickerTranslateY }],
        },
      ]}
    >
      <View style={styles.emojiPickerHeader}>
        <Text style={styles.emojiPickerTitle}>Emoji</Text>
        <TouchableOpacity 
          onPress={() => setShowEmojiPicker(false)}
          style={styles.closeButton}
        >
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.emojiGridContainer}>
        {EMOJI_CATEGORIES.map((category, i) => (
          <View key={i}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.emojiGrid}>
              {category.data.map((emoji, j) => (
                <TouchableOpacity
                  key={j}
                  style={styles.emojiButton}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

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
        {renderEmojiPicker()}
        
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
            {voiceMessages.map((voiceMsg, index) => {
              const playback = voiceMessagePlaybacks[voiceMsg.uri] || { 
                isPlaying: false, 
                currentPosition: 0,
                duration: voiceMsg.duration
              };
              
              return (
                <View key={index} style={styles.voiceMessageItem}>
                  <Headphones size={20} color="#3b82f6" />
                  <Text style={styles.voiceMessageDuration}>
                    {playback.isPlaying 
                      ? formatTime(playback.currentPosition) 
                      : formatTime(voiceMsg.duration)
                    }
                  </Text>
                  <TouchableOpacity 
                    onPress={() => playVoiceMessage(voiceMsg)}
                    style={styles.playButton}
                  >
                    {playback.isPlaying ? (
                      <Square size={16} color="#3b82f6" />
                    ) : (
                      <Play size={16} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      // Remove the voice message
                      const newVoiceMessages = [...voiceMessages];
                      newVoiceMessages.splice(index, 1);
                      setVoiceMessages(newVoiceMessages);
                      
                      // Also clean up the sound object if it exists
                      if (voiceMessagePlaybacks[voiceMsg.uri]?.sound) {
                        voiceMessagePlaybacks[voiceMsg.uri].sound?.release();
                        setVoiceMessagePlaybacks(prev => {
                          const newPlaybacks = { ...prev };
                          delete newPlaybacks[voiceMsg.uri];
                          return newPlaybacks;
                        });
                      }
                      
                      // Clear the interval if it exists
                      if (currentTimeIntervals[voiceMsg.uri]) {
                        clearInterval(currentTimeIntervals[voiceMsg.uri]);
                        setCurrentTimeIntervals(prev => {
                          const newIntervals = { ...prev };
                          delete newIntervals[voiceMsg.uri];
                          return newIntervals;
                        });
                      }
                    }}
                    style={styles.removeVoiceButton}
                  >
                    <X size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Attachment previews - Clean and organized */}
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
                          <X size={14} color="#fff" />
                        </TouchableOpacity>
                        
                        {fileData.file.type?.startsWith('image/') ? (
                          <Image 
                            source={{ uri: fileData.file.uri }} 
                            style={styles.attachmentImage}
                            resizeMode="cover"
                          />
                        ) : fileData.file.type?.startsWith('audio/') ? (
                          <View style={styles.attachmentPreviewInfo}>
                            <Headphones size={24} color="#3b82f6" />
                            <Text 
                              style={styles.attachmentPreviewName}
                              numberOfLines={1}
                              ellipsizeMode="middle"
                            >
                              Voice Message
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
                            
                            {/* Retry button for failed uploads */}
                            {fileData.status === 'error' && (
                              <TouchableOpacity 
                                onPress={() => retryUpload(fileData.id)}
                                style={styles.retryButton}
                              >
                                <Text style={styles.retryText}>Retry</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <View style={styles.attachmentPreviewInfo}>
                            {renderAttachmentIcon(getFileType(fileData.file.name, fileData.file.type))}
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
                            
                            {/* Retry button for failed uploads */}
                            {fileData.status === 'error' && (
                              <TouchableOpacity 
                                onPress={() => retryUpload(fileData.id)}
                                style={styles.retryButton}
                              >
                                <Text style={styles.retryText}>Retry</Text>
                              </TouchableOpacity>
                            )}
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
            chatId={chatId}
            onAttachmentsChange={handleAttachmentsChange}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            uploading={isSending}
            onUploadStatusChange={handleUploadStatusChange}
            onFilesSelected={handleFilesSelected}
            onUploadFiles={uploadFiles}
            selectedFiles={selectedFiles}
            onVoiceRecord={handleVoiceRecord}
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
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
  voiceMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  voiceMessageDuration: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  playButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeVoiceButton: {
    padding: 4,
    marginLeft: 8,
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
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
  emojiPicker: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: '#fff',
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    height: Dimensions.get('window').height * 0.4,
    zIndex: 1000,
  },
  emojiPickerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  emojiPickerTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#374151' 
  },
  closeButton: { 
    padding: 4 
  },
  emojiGridContainer: { 
    flex: 1, 
    padding: 12 
  },
  categoryTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#6b7280', 
    marginTop: 12,
    marginBottom: 8,
  },
  emojiGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  emojiButton: { 
    width: Dimensions.get('window').width / 8, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emojiText: { 
    fontSize: 24 
  },
});

export default MessageInput;