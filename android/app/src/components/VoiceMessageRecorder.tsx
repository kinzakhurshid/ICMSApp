import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

interface VoiceMessageRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onSend,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (isRecording) {
        audioRecorderPlayer.stopRecorder();
      }
      if (isPlaying) {
        audioRecorderPlayer.stopPlayer();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isRecording, isPlaying]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (hasPermission) {
          return true;
        }

        // Request permission
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
    }
    return true;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please allow microphone access to record voice messages.');
        return;
      }

      // Try different configurations until one works
      let result = null;
      const configs = [
        {
          SampleRate: 44100,
          Channels: 1,
          AudioQuality: 'High',
          AudioEncoding: 'aac',
          AudioEncodingBitRate: 128000,
        },
        {
          SampleRate: 22050,
          Channels: 1,
          AudioQuality: 'Medium',
          AudioEncoding: 'aac',
          AudioEncodingBitRate: 64000,
        },
        {
          SampleRate: 16000,
          Channels: 1,
          AudioQuality: 'Low',
          AudioEncoding: 'aac',
          AudioEncodingBitRate: 32000,
        }
      ];

      for (const config of configs) {
        try {
          result = await audioRecorderPlayer.startRecorder(undefined, config);
          if (result) {
            console.log('Recording started with config:', config);
            break;
          }
        } catch (error) {
          console.log('Config failed, trying next:', config, error.message);
          continue;
        }
      }
      console.log('Recording started:', result);
      
      if (!result) {
        Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        return;
      }
      
      setIsRecording(true);
      setDuration(0);
      setRecordingUri(null);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

    } catch (error) {
      console.error('Failed to start recording:', error);
      let errorMessage = 'Failed to start recording';
      
      if (error.message?.includes('EROFS') || error.message?.includes('Read-only')) {
        errorMessage = 'Cannot access microphone. Please check app permissions and try again.';
      } else if (error.message?.includes('Permission')) {
        errorMessage = 'Microphone permission is required to record voice messages.';
      }
      
      Alert.alert('Recording Error', errorMessage);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      console.log('Recording stopped:', result);
      
      setRecordingUri(result);
      setIsRecording(false);
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      // Stop pulse animation
      pulseAnim.stopAnimation();

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (isPlaying) {
        await audioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
        setIsPaused(false);
      } else {
        const result = await audioRecorderPlayer.startPlayer(recordingUri);
        console.log('Playing:', result);
        setIsPlaying(true);
        setIsPaused(false);
        
        audioRecorderPlayer.addPlayBackListener((e) => {
          if (e.currentPosition === e.duration) {
            setIsPlaying(false);
            setIsPaused(false);
          }
        });
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const sendRecording = async () => {
    if (!recordingUri) return;

    try {
      // Just pass the URI to the parent component for preview
      onSend(recordingUri, duration);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      Alert.alert('Error', 'Failed to send voice message');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!isRecording && !recordingUri && (
          <View style={styles.initialState}>
            <Text style={styles.instructionText}>Hold to record voice message</Text>
            <TouchableOpacity
              style={styles.recordButton}
              onPressIn={startRecording}
            >
              <Ionicons name="mic" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {isRecording && (
          <View style={styles.recordingState}>
            <Animated.View style={[styles.recordingButton, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="mic" size={24} color="#fff" />
            </Animated.View>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {recordingUri && !isRecording && (
          <View style={styles.previewState}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={playRecording}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color="#2196f3" 
              />
            </TouchableOpacity>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Ionicons name="close" size={20} color="#f44336" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendRecording}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  initialState: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  recordingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceMessageRecorder;
