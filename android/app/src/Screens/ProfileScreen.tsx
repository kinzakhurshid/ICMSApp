import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      <Image
        source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
        style={styles.avatar}
      />
      {/* User Info */}
      <Text style={styles.name}>Kinza Khurshid</Text>
      <Text style={styles.email}>kinza@example.com</Text>

      {/* Buttons */}
      <TouchableOpacity style={styles.button}>
        <Ionicons name="pencil-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#ef4444" }]}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "bold", color: "#111" },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: 200,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, marginLeft: 8 },
});

export default ProfileScreen;
