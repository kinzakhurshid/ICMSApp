import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { User } from "../types/chattypes";

const { width } = Dimensions.get("window");

interface CallScreenProps {
  callData: any;
  currentUser: User;
  onEndCall: () => void;
  onToggleAudio: (muted: boolean) => void;
  onToggleVideo: (disabled: boolean) => void;
  onSwitchCamera: () => void;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
}

const CallScreen: React.FC<CallScreenProps> = ({
  callData,
  currentUser,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
  isAudioMuted,
  isVideoDisabled,
}) => {
  const [timer, setTimer] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef<NodeJS.Timeout>();

  const isIncoming = callData.status === "ringing";
  const isCaller = callData.caller._id === currentUser._id;
  const isVideoCall = callData.type === "video";
  const isOngoing = callData.status === "ongoing";

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isOngoing) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOngoing]);

  // Auto hide controls in video
  useEffect(() => {
    if (isVideoCall && isOngoing) {
      fadeAnim.setValue(1);
      setShowControls(true);

      controlsTimeout.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isVideoCall, isOngoing]);

  const toggleControls = () => {
    if (!isVideoCall || !isOngoing) return;
    if (showControls) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    } else {
      setShowControls(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      controlsTimeout.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getCallStatus = () => {
    if (isIncoming) return "Ringing...";
    if (isOngoing) return formatTime(timer);
    return "Calling...";
  };

  const getCallName = () => {
    return isCaller ? callData.receiver.name : callData.caller.name;
  };

  const renderRemoteView = () => {
    if (isVideoCall) {
      return (
        <View style={styles.videoBackground}>
          {/* Replace this with actual remote video stream */}
          <Text style={styles.remoteVideoText}>Video Stream</Text>
        </View>
      );
    }
    return (
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              (isCaller ? callData.receiver.avatar : callData.caller.avatar) ||
              "https://via.placeholder.com/150",
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{getCallName()}</Text>
        <Text style={styles.status}>{getCallStatus()}</Text>
      </View>
    );
  };

  const renderControls = () => {
    if (!showControls) return null;

    return (
      <Animated.View style={[styles.controlsContainer, { opacity: fadeAnim }]}>
        <View style={styles.controlsRow}>
          <ControlButton
            icon={isAudioMuted ? "mic-off" : "mic"}
            label={isAudioMuted ? "Unmute" : "Mute"}
            active={isAudioMuted}
            onPress={() => onToggleAudio(!isAudioMuted)}
          />

          {isVideoCall && (
            <ControlButton
              icon={isVideoDisabled ? "videocam-off" : "videocam"}
              label={isVideoDisabled ? "Camera Off" : "Camera On"}
              active={isVideoDisabled}
              onPress={() => onToggleVideo(!isVideoDisabled)}
            />
          )}

          {isVideoCall && (
            <ControlButton
              icon="camera-reverse"
              label="Flip"
              onPress={onSwitchCamera}
            />
          )}

          <ControlButton icon="volume-high" label="Speaker" />
        </View>

        {/* End Call Button */}
        <View style={styles.endCallContainer}>
          <TouchableOpacity
            style={styles.hangupButton}
            onPress={onEndCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <TouchableOpacity
        style={styles.fullScreen}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {renderRemoteView()}
        {renderControls()}
      </TouchableOpacity>
    </View>
  );
};

// Reusable control button
const ControlButton = ({
  icon,
  label,
  onPress,
  active,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  active?: boolean;
}) => (
  <TouchableOpacity style={styles.controlButton} onPress={onPress}>
    <View
      style={[
        styles.controlCircle,
        active ? styles.controlCircleActive : null,
      ]}
    >
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text style={styles.controlLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fullScreen: { flex: 1 },
  videoBackground: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  remoteVideoText: { color: "white", fontSize: 18 },
  avatarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    marginBottom: 20,
  },
  name: { color: "white", fontSize: 28, fontWeight: "600" },
  status: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: 6,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  controlButton: { alignItems: "center" },
  controlCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  controlCircleActive: { backgroundColor: "rgba(255,0,0,0.6)" },
  controlLabel: { color: "white", fontSize: 12 },
  endCallContainer: { alignItems: "center" },
  hangupButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CallScreen;
