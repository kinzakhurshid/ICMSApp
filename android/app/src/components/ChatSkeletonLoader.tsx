import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const MessageSkeleton = () => {
  return (
    <View style={styles.messageSkeleton}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <View style={styles.messageContent}>
        <SkeletonLoader width={60} height={12} style={styles.senderName} />
        <SkeletonLoader width="80%" height={16} style={styles.messageText} />
        <SkeletonLoader width={120} height={12} style={styles.timestamp} />
      </View>
    </View>
  );
};

export const ChatListSkeleton = () => {
  return (
    <View style={styles.chatListSkeleton}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.chatItemSkeleton}>
          <SkeletonLoader width={56} height={56} borderRadius={28} />
          <View style={styles.chatInfo}>
            <SkeletonLoader width={150} height={16} style={styles.chatName} />
            <SkeletonLoader width={200} height={14} style={styles.chatPreview} />
          </View>
          <SkeletonLoader width={40} height={14} style={styles.chatTime} />
        </View>
      ))}
    </View>
  );
};

export const MessageListSkeleton = () => {
  return (
    <View style={styles.messageListSkeleton}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <MessageSkeleton key={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  messageSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  senderName: {
    marginBottom: 6,
  },
  messageText: {
    marginBottom: 6,
  },
  timestamp: {
    marginTop: 4,
  },
  chatListSkeleton: {
    padding: 16,
  },
  chatItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    marginBottom: 8,
  },
  chatPreview: {
    marginBottom: 4,
  },
  chatTime: {
    alignSelf: 'flex-end',
  },
  messageListSkeleton: {
    padding: 16,
  },
});

export default SkeletonLoader;


