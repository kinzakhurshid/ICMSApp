import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Headphones, Play, Square, X } from 'lucide-react-native';
import Sound from 'react-native-sound';
import { formatTime } from './MessageInput'; // You'll need to export this from MessageInput

Sound.setCategory('Playback');

interface VoiceMessagePlayerProps {
  voiceMessage: {
    uri: string;
    duration: number;
    id: string;
  };
  onRemove: () => void;
}

 const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ voiceMessage, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, [sound]);

  const playVoiceMessage = async () => {
    try {
      if (sound && isPlaying) {
        // If already playing, pause it
        sound.pause();
        setIsPlaying(false);
        return;
      }

      if (sound && !isPlaying) {
        // If we have a sound object but it's not playing, resume it
        setIsLoading(true);
        sound.play((success) => {
          setIsLoading(false);
          if (success) {
            setIsPlaying(false);
            setCurrentPosition(0);
          } else {
            console.error('Playback failed');
            Alert.alert('Error', 'Failed to play voice message');
          }
        });
        setIsPlaying(true);
        return;
      }

      // Create a new sound object
      setIsLoading(true);
      
      // For Android, use the actual file path without file:// scheme
      let soundPath = voiceMessage.uri;
      if (Platform.OS === 'android') {
        soundPath = soundPath.replace('file://', '');
      }
      
      const newSound = new Sound(soundPath, '', (error) => {
        setIsLoading(false);
        if (error) {
          console.error('Failed to load the sound', error);
          Alert.alert('Error', 'Failed to play voice message');
          return;
        }
        
        // Play the sound
        newSound.play((success) => {
          if (success) {
            setIsPlaying(false);
            setCurrentPosition(0);
            newSound.release();
            setSound(null);
          } else {
            console.error('Playback failed');
          }
        });
        
        setSound(newSound);
        setIsPlaying(true);
        
        // Update position periodically
        const interval = setInterval(() => {
          newSound.getCurrentTime((seconds) => {
            setCurrentPosition(seconds);
          });
        }, 100);
        
        // Clean up interval when sound completes
        setTimeout(() => {
          clearInterval(interval);
        }, voiceMessage.duration * 1000);
      });
      
    } catch (error) {
      setIsLoading(false);
      console.error('Error playing voice message:', error);
      Alert.alert('Error', 'Failed to play voice message');
    }
  };

  return (
    <View style={styles.voiceMessageItem}>
      <Headphones size={20} color="#3b82f6" />
      <Text style={styles.voiceMessageDuration}>
        {isPlaying ? formatTime(currentPosition) : formatTime(voiceMessage.duration)}
      </Text>
      <TouchableOpacity 
        onPress={playVoiceMessage}
        style={styles.playButton}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : isPlaying ? (
          <Square size={16} color="#3b82f6" />
        ) : (
          <Play size={16} color="#3b82f6" />
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={onRemove}
        style={styles.removeVoiceButton}
      >
        <X size={16} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeVoiceButton: {
    padding: 4,
    marginLeft: 8,
  },
});
export default VoiceMessagePlayer;