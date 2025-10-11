import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message } from '../types/chattypes';

interface ReplyMessageProps {
  message: Message;
  onCancel?: () => void;
  isPreview?: boolean;
}

const ReplyMessage: React.FC<ReplyMessageProps> = ({ 
  message, 
  onCancel, 
  isPreview = false 
}) => {
  if (!message) return null;

  return (
    <View style={[styles.container, isPreview && styles.previewContainer]}>
      <View style={styles.replyLine} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.senderName}>
            {message.sender.name}
          </Text>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.messageContent} numberOfLines={2}>
          {message.content}
        </Text>
        {message.attachments && message.attachments.length > 0 && (
          <Text style={styles.attachmentText}>
            📎 {message.attachments.length} attachment(s)
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 12,
  },
  previewContainer: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  replyLine: {
    width: 3,
    backgroundColor: '#2196f3',
    marginRight: 8,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196f3',
  },
  cancelButton: {
    padding: 4,
  },
  messageContent: {
    fontSize: 13,
    color: '#555',
    lineHeight: 16,
  },
  attachmentText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default ReplyMessage;
