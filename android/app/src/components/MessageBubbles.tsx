import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Message, User } from "../types/chattypes";
import Ionicons from "react-native-vector-icons/Ionicons";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  currentUser: User;
  isGroupChat?: boolean;
  typing?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  currentUser,
  isGroupChat,
  typing = false,
}) => {
  const isAttachment = message.attachments && message.attachments.length > 0;

  const handleAttachmentPress = (attachment: any) => {
    if (attachment.url) {
      Linking.openURL(attachment.url).catch(err => 
        console.error('Failed to open attachment:', err)
      );
    }
  };

  const renderAttachment = (attachment: any, index: number) => {
    const fileType = attachment.fileType || 'other';
    
    return (
      <TouchableOpacity 
        key={index}
        style={styles.attachmentCard}
        onPress={() => handleAttachmentPress(attachment)}
      >
        {fileType === 'image' ? (
          <Ionicons name="image-outline" size={20} color="#374151" />
        ) : fileType === 'video' ? (
          <Ionicons name="videocam-outline" size={20} color="#374151" />
        ) : fileType === 'audio' ? (
          <Ionicons name="musical-notes-outline" size={20} color="#374151" />
        ) : (
          <Ionicons name="document-attach-outline" size={20} color="#374151" />
        )}
        <View style={styles.attachmentInfo}>
          <Text style={styles.attachmentName} numberOfLines={1}>
            {attachment.originalName || attachment.name || "Attachment"}
          </Text>
          {attachment.size && (
            <Text style={styles.attachmentSize}>
              {attachment.size}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
      ]}
    >
      {!isCurrentUser && (
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={32} color="#9CA3AF" />
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          {!isCurrentUser && isGroupChat && (
            <Text style={styles.senderName}>{message.sender.name}</Text>
          )}

          {message.type === "text" && (
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.currentUserText : styles.otherUserText,
              ]}
            >
              {message.content}
            </Text>
          )}

          {isAttachment && message.attachments?.map((attachment, index) => 
            renderAttachment(attachment, index)
          )}
        </View>

        <Text
          style={[
            styles.timestamp,
            isCurrentUser ? styles.timestampRight : styles.timestampLeft,
          ]}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {isCurrentUser && <View style={styles.spacer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
  },
  currentUserContainer: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  otherUserContainer: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: "flex-start",
  },
  bubbleWrapper: {
    maxWidth: "75%",
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 4,
  },
  currentUserBubble: {
    backgroundColor: "#3B82F6",
    borderTopRightRadius: 4,
    alignSelf: "flex-end",
  },
  otherUserBubble: {
    backgroundColor: "#E5E7EB",
    borderTopLeftRadius: 4,
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: "#FFFFFF",
  },
  otherUserText: {
    color: "#111827",
  },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
  },
  attachmentSize: {
    fontSize: 12,
    color: "#6B7280",
  },
  timestamp: {
    fontSize: 10,
    color: "#9CA3AF",
    marginHorizontal: 4,
  },
  timestampLeft: {
    alignSelf: "flex-start",
  },
  timestampRight: {
    alignSelf: "flex-end",
  },
  spacer: {
    width: 40,
  },
});

export default MessageBubble;