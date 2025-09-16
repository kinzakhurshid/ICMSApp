// src/components/ChatListItem.tsx
import React, { memo } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Chat, User } from "../types/chattypes";

interface Props {
  chat: Chat & { unreadCount?: number; lastUpdated?: number };
  currentUser: User;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
}

const ChatListItem: React.FC<Props> = ({ chat, currentUser, isSelected, onSelect }) => {
  const getChatName = () => {
    if (chat.name) return chat.name;
    const other = chat.members.find((m) => m._id !== currentUser._id);
    return other?.name || "Unknown";
  };
  return (
    <TouchableOpacity style={[styles.row, isSelected && styles.rowSelected]} onPress={() => onSelect(chat)}>
      <Image
        source={{ uri: chat.avatar || "https://randomuser.me/api/portraits/lego/1.jpg" }}
        style={styles.avatar}
      />
      <View style={styles.center}>
        <Text numberOfLines={1} style={styles.title}>{getChatName()}</Text>
        <Text numberOfLines={1} style={styles.sub}>
          {chat.lastMessage?.content || "No messages yet"}
        </Text>
      </View>
      {!!(chat as any).unreadCount && (chat as any).unreadCount > 0 && (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{(chat as any).unreadCount}</Text></View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB",
  },
  rowSelected: { backgroundColor: "#F3F4F6" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E5E7EB" },
  center: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: "#111827" },
  sub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  badge: { backgroundColor: "#3B82F6", minWidth: 22, paddingHorizontal: 6, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
export default memo(ChatListItem);
