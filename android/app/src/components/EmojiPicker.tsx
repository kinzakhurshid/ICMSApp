import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { Animated } from 'react-native';

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

interface EmojiPickerProps {
  visible: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  slideAnim: Animated.Value;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ visible, onEmojiSelect, onClose, slideAnim }) => {
  if (!visible) return null;

  const emojiPickerTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
  });

  return (
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
          onPress={onClose}
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
                  onPress={() => onEmojiSelect(emoji)}
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
};

const styles = StyleSheet.create({
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

export default EmojiPicker;