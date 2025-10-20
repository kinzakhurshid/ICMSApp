import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface CallScreenProps {
  route?: {
    params: {
      userName: string;
      userAvatar: string;
      isVideoCall?: boolean;
      isIncoming?: boolean;
    };
  };
}

const CallScreen: React.FC<CallScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  
  // Animation values
  const pulseAnim = new Animated.Value(1);
  const fadeAnim = new Animated.Value(0);

  const { userName = 'John Doe', userAvatar = '', isVideoCall = false, isIncoming = false } = route?.params || {};

  useEffect(() => {
    // Start call animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Simulate call connection after 2 seconds
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
      startCallTimer();
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  const startCallTimer = () => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    // Store timer reference for cleanup
    return () => clearInterval(timer);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      {/* Background with gradient effect */}
      <View style={styles.background} />
      
      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* User info section */}
        <View style={styles.userSection}>
          <Animated.View 
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Image
              source={{ 
                uri: userAvatar || 'https://via.placeholder.com/150/6B7280/FFFFFF?text=' + userName.charAt(0)
              }}
              style={styles.avatar}
            />
            {callStatus === 'connecting' && (
              <View style={styles.connectingOverlay}>
                <View style={styles.connectingDot} />
              </View>
            )}
          </Animated.View>
          
          <Text style={styles.userName}>{userName}</Text>
          
          <Text style={styles.callStatus}>
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call ended'}
          </Text>
          
          {isVideoCall && callStatus === 'connected' && (
            <Text style={styles.videoStatus}>
              {isVideoOn ? 'Video on' : 'Video off'}
            </Text>
          )}
        </View>

        {/* Call controls */}
        <View style={styles.controlsContainer}>
          {/* Top row controls */}
          <View style={styles.topControls}>
            <TouchableOpacity 
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons 
                name={isMuted ? "mic-off" : "mic"} 
                size={24} 
                color={isMuted ? "#FFFFFF" : "#1F2937"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons 
                name={isSpeakerOn ? "volume-high" : "volume-low"} 
                size={24} 
                color={isSpeakerOn ? "#FFFFFF" : "#1F2937"} 
              />
            </TouchableOpacity>
            
            {isVideoCall && (
              <TouchableOpacity 
                style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
                onPress={toggleVideo}
              >
                <Ionicons 
                  name={isVideoOn ? "videocam" : "videocam-off"} 
                  size={24} 
                  color={!isVideoOn ? "#FFFFFF" : "#1F2937"} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom row - End call button */}
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              style={styles.endCallButton}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1F2937',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  userSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#374151',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  connectingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  userName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  callStatus: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 8,
    textAlign: 'center',
  },
  videoStatus: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bottomControls: {
    alignItems: 'center',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    transform: [{ rotate: '135deg' }],
  },
});

export default CallScreen;




