import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { X, Square, Mic } from 'lucide-react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { Animated } from 'react-native';

const audioRecorderPlayer = new AudioRecorderPlayer();

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
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordPath, setRecordPath] = useState('');

  const waveformAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      // Clean up any ongoing recording
      if (isRecording) {
        audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
      }
    };
  }, []);

  const getRecordingPath = async () => {
    try {
      // Create directory if it doesn't exist
      const directory = `${RNFS.DocumentDirectoryPath}/recordings`;
      const exists = await RNFS.exists(directory);
      if (!exists) {
        await RNFS.mkdir(directory);
      }
      
      return `${directory}/voice_message_${Date.now()}.m4a`;
    } catch (error) {
      console.error('Error getting recording path:', error);
      throw error;
    }
  };

  const requestAndroidPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        // Only request microphone permission for Android 13+
        const apiLevel = Platform.Version;
        
        if (apiLevel >= 33) {
          // Android 13+ only needs microphone permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'This app needs access to your microphone to record voice messages.',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For older Android versions, request both
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ]);
          
          return (
            granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      }
      return true; // iOS doesn't need storage permissions for app-specific directories
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version;
        
        if (apiLevel >= 33) {
          // Check only microphone permission for Android 13+
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          return hasPermission;
        } else {
          // Check both permissions for older Android
          const hasMicPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          const hasStoragePermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          return hasMicPermission && hasStoragePermission;
        }
      }
      return true; // iOS permissions are handled differently
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Check if we already have permissions
      const hasPermissions = await checkPermissions();
      
      if (!hasPermissions) {
        // Request permissions if we don't have them
        const granted = await requestAndroidPermissions();
        if (!granted) {
          Alert.alert('Permission Denied', 'Microphone permission is required to record voice messages.');
          return;
        }
      }

      // Get proper recording path
      const path = await getRecordingPath();
      console.log('Recording path:', path);

      const result = await audioRecorderPlayer.startRecorder(path);
      setRecordPath(result);
      
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordSecs(e.currentPosition);
        setRecordingTime(Math.floor(e.currentPosition / 1000));
        
        // Generate waveform data (simulated)
        if (e.currentPosition % 500 === 0) {
          setRecordingWaveform(prev => [...prev.slice(-50), Math.random() * 30 + 10]);
        }
      });

      setIsRecording(true);
      
      // Start timer for UI updates
      const timer = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // 5 minutes max
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
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

      if (!isRecording) {
        console.log('Not recording, nothing to stop');
        return;
      }

      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      
      setIsRecording(false);
      
      // Verify the file exists
      const fileExists = await RNFS.exists(result);
      if (!fileExists) {
        console.warn('Recorded file does not exist:', result);
        Alert.alert('Error', 'Recording failed. Please try again.');
        return;
      }
      
      // Return the actual recorded audio data
      onRecordingComplete({
        uri: result,
        duration: Math.floor(recordSecs / 1000),
        waveform: recordingWaveform
      });
      
      // Reset states
      setRecordSecs(0);
      setRecordPath('');
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    try {
      if (isRecording) {
        await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        
        // Delete the cancelled recording file
        if (recordPath) {
          try {
            await RNFS.unlink(recordPath);
          } catch (deleteError) {
            console.warn('Failed to delete recording file:', deleteError);
          }
        }
      }
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      
      setIsRecording(false);
      setRecordingTime(0);
      setRecordingWaveform([]);
      setRecordSecs(0);
      setRecordPath('');
      waveformAnim.stopAnimation();
      onRecordingCancel();
      
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const formatTimeDisplay = (seconds: number) => {
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
        {recordingWaveform.length === 0 && (
          <Text style={voiceStyles.recordingHint}>Start speaking to record</Text>
        )}
      </View>

      <View style={voiceStyles.controls}>
        <Text style={voiceStyles.timeText}>
          {formatTimeDisplay(recordingTime)}
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
  recordingHint: {
    color: '#6b7280',
    fontSize: 14,
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
    backgroundColor: '#3b82f6',
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
});

export default VoiceRecorder;