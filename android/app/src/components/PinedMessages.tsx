import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'react-native-feather';
import { Message } from '../types/chattypes';
import MessageBubble from './MessageBubble';

interface PinnedMessagesProps {
  pinnedMessages: Message[];
  onClose: () => void;
}

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  pinnedMessages,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pinned Messages</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X width={20} height={20} color="#374151" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={pinnedMessages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isCurrentUser={false}
            currentUser={{ _id: '', name: '', email: '' }}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    padding: 16,
  },
});

export default PinnedMessages;