import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'left' | 'right';
  alignment?: 'top' | 'bottom';
}

const { width: screenWidth } = Dimensions.get('window');

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ReactionPicker: React.FC<ReactionPickerProps> = ({ 
  onSelect, 
  onClose, 
  position = 'left',
  alignment = 'top'
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const pickerRef = useRef<View>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSelect(emoji);
    
    // Close after a short delay to show the selection
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Animated.View
      ref={pickerRef}
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        position === 'right' ? styles.rightPosition : styles.leftPosition,
        alignment === 'bottom' ? styles.bottomAlignment : styles.topAlignment,
      ]}
    >
      <View style={styles.emojiContainer}>
        {emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.emojiButton,
              selectedEmoji === emoji && styles.selectedEmoji,
            ]}
            onPress={() => handleSelect(emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Arrow indicator */}
      <View style={[
        styles.arrow,
        position === 'right' ? styles.rightArrow : styles.leftArrow,
        alignment === 'bottom' ? styles.bottomArrow : styles.topArrow,
      ]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 9999,
    zIndex: 9999,
  },
  emojiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 16,
    marginHorizontal: 2,
  },
  selectedEmoji: {
    backgroundColor: '#F3F4F6',
    transform: [{ scale: 1.1 }],
  },
  emoji: {
    fontSize: 18,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
  leftPosition: {
    left: 10,
  },
  rightPosition: {
    right: 10,
  },
  topAlignment: {
    bottom: 30,
  },
  bottomAlignment: {
    top: 30,
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  topArrow: {
    top: '100%',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  bottomArrow: {
    bottom: '100%',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
});

export default ReactionPicker;
