import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const InboxScreen = () => {
  const [messages] = useState([
    { id: "1", sender: "John Doe", message: "Hey, how are you?", time: "10:30 AM" },
    { id: "2", sender: "Jane Smith", message: "Don’t forget the meeting.", time: "9:45 AM" },
    { id: "3", sender: "Michael", message: "See you tomorrow!", time: "Yesterday" },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.messageCard}>
      <Ionicons name="mail-outline" size={24} color="#3b82f6" />
      <View style={styles.messageContent}>
        <Text style={styles.sender}>{item.sender}</Text>
        <Text style={styles.preview}>{item.message}</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inbox</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  messageContent: { flex: 1, marginLeft: 12 },
  sender: { fontSize: 16, fontWeight: "600", color: "#111" },
  preview: { fontSize: 14, color: "#6b7280" },
  time: { fontSize: 12, color: "#9ca3af" },
});

export default InboxScreen;

