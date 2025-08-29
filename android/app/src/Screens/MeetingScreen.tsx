import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../hooks/useAxios";

const { width } = Dimensions.get("window");

export interface Meeting {
  _id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime?: string;
  date: string;
  createdBy: any;
  participants: any[];
  status: "Scheduled" | "Completed" | "Cancelled";
  meetingLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

const MeetingDashboard = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Active");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { callApi, error } = useAxios();
  const flatListRef = useRef<FlatList>(null);

  // Create meeting URL
  const CREATE_MEETING_URL = "http://89.116.32.31:3002/PM/meeting/create";

  // Fetch meetings data
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: "GET",
        url: "/meetings",
      });

      let meetingsData = null;

      if (Array.isArray(response)) {
        meetingsData = response;
      } else if (response && Array.isArray(response.data)) {
        meetingsData = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        meetingsData = response.data.data;
      } else if (response && response.data) {
        meetingsData = response.data;
      }

      if (meetingsData && Array.isArray(meetingsData)) {
        const meetingsWithStatus = meetingsData.map((m: any) => ({
          ...m,
          status: m.status || "Scheduled",
        }));

        setMeetings(meetingsWithStatus);
      } else {
        Alert.alert("Error", "Invalid meeting data received from server");
        setMeetings([]);
      }
    } catch (error: any) {
      console.error("Error fetching meetings from API:", error);
      Alert.alert("Error", `Failed to load meetings: ${error.message || error}`);
      setMeetings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMeetings();
  };

  // Open create meeting URL in browser
  const handleCreateMeeting = () => {
    Linking.openURL(CREATE_MEETING_URL).catch((err) => {
      console.error("Failed to open URL:", err);
      Alert.alert("Error", "Could not open the meeting creation page.");
    });
  };

  const getUserName = (user: any): string => {
    if (!user) return "Unknown";
    if (typeof user === "string") return user;
    if (typeof user === "object") {
      return (
        user.fullName ||
        (user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email || user.username || user.name || user._id || "Unknown")
      );
    }
    return "Unknown";
  };

  const getParticipantNames = (participants: any[]): string => {
    if (!participants || !Array.isArray(participants)) return "No participants";
    
    return (
      participants
        .map((participant) => {
          // If participant is just an ID string, we can't get the name
          if (typeof participant === "string") {
            return participant; // This will show the ID, but we need to fetch names
          }
          
          // If participant is an object with user details
          if (typeof participant === "object") {
            // Check if participant has user object nested
            if (participant.user) {
              return getUserName(participant.user);
            }
            // Check if participant has employee object nested
            if (participant.employee) {
              return getUserName(participant.employee);
            }
            // If participant is the user object itself
            return getUserName(participant);
          }
          
          return "Unknown";
        })
        .filter((name) => name !== "Unknown" && name !== "No participants")
        .join(", ") || "No participants"
    );
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesTab =
      activeTab === "Active"
        ? meeting.status !== "Completed"
        : meeting.status === "Completed";

    const creatorName = getUserName(meeting.createdBy).toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      meeting.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatDate(meeting.date).toLowerCase().includes(searchQuery.toLowerCase()) ||
      creatorName.includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Format date to display only date part
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return "No date";
      
      // If it's already in a good format, return as is
      if (dateString.includes("T")) {
        const datePart = dateString.split("T")[0];
        return datePart;
      }
      
      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Pie chart data
  const getPieChartData = () => {
    const statusCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
    meetings.forEach((m) => {
      if (statusCounts.hasOwnProperty(m.status)) {
        statusCounts[m.status]++;
      }
    });
    
    return [
      { 
        name: `Scheduled`, 
        population: statusCounts.Scheduled, 
        color: "#FF0004", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      },
      { 
        name: `Completed`, 
        population: statusCounts.Completed, 
        color: "#D7AA00", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      },
      { 
        name: `Cancelled`, 
        population: statusCounts.Cancelled, 
        color: "#FF5900", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      },
    ];
  };

  const getRecentMeetings = () => {
    const now = new Date();
    const todayMidnight = new Date(now.setHours(0, 0, 0, 0));

    let recent = meetings
      .filter((m) => m.status === "Scheduled")
      .filter((m) => {
        const meetingDateTime = new Date(m.date);
        if (m.time) {
          const [hours, minutes] = m.time.split(":").map(Number);
          meetingDateTime.setUTCHours(hours, minutes, 0, 0);
        }
        return meetingDateTime >= todayMidnight;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item,
        color: Math.random() > 0.5 ? "#E6F0FF" : "#E6FFFA",
        time: item.time || "09:00",
      }));

    // Remove duplicates by _id using a Set
    const uniqueIds = new Set();
    const unique = recent.filter((m) => {
      if (uniqueIds.has(m._id)) {
        return false;
      }
      uniqueIds.add(m._id);
      return true;
    });

    return unique;
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    if (meeting.meetingLink) {
      Linking.openURL(meeting.meetingLink).catch((err) => {
        console.error("Failed to open URL:", err);
        Alert.alert("Error", "Could not open the meeting link.");
      });
    } else {
      Alert.alert("No Meeting Link", "This meeting doesn't have a joinable link.");
    }
  };

  // Scroll recent meetings left/right
  const scrollRecentLeft = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  };

  const scrollRecentRight = () => {
    if (flatListRef.current) {
      const recentMeetings = getRecentMeetings();
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  if (loading && meetings.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#d9534f" />
        <Text style={styles.loadingText}>Loading meetings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error.message || error}</Text>
        <Text style={styles.errorSubText}>
          Please check your connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMeetings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Text style={styles.header}>Meeting Dashboard</Text>

      {/* Overview */}
      <View style={styles.card}>
        <View style={styles.overviewHeader}>
          <Text style={styles.cardTitle}>Meetings Overview</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreateMeeting}
          >
            <Text style={styles.createText}>+ Create</Text>
          </TouchableOpacity>
        </View>
        <PieChart
          data={getPieChartData()}
          width={width - 60}
          height={200}
          chartConfig={{
            color: () => `#000`,
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          hasLegend={true}
          center={[0, 0]}
        />
      </View>

      {/* Recent Meetings */}
      <View style={styles.card}>
        <View style={styles.recentHeader}>
          <Text style={styles.cardTitle}>Recent Meetings</Text>
          <View style={styles.arrowContainer}>
            <TouchableOpacity onPress={scrollRecentLeft} style={styles.arrowButton}>
              <Ionicons name="chevron-back-circle" size={24} color="#FF5722" />
            </TouchableOpacity>
            <TouchableOpacity onPress={scrollRecentRight} style={styles.arrowButton}>
              <Ionicons name="chevron-forward-circle" size={24} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          data={getRecentMeetings()}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={[styles.meetingCard, { backgroundColor: item.color }]}>
              <Text style={styles.meetingTitle}>{item.name}</Text>
              <Text style={styles.meetingTime}>{item.time}</Text>
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => handleJoinMeeting(item)}
              >
                <Text style={styles.joinText}>Join Meeting</Text>
              </TouchableOpacity>
              <Text style={styles.meetingDate}>{formatDate(item.date)}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 10, paddingRight: 10 }}
          ListEmptyComponent={
            <View style={styles.noMeetings}>
              <Text style={styles.noMeetingsText}>No upcoming meetings</Text>
            </View>
          }
        />
      </View>

      {/* Meetings Table */}
      <View style={styles.card}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("Active")}
            style={[styles.tab, activeTab === "Active" && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, activeTab === "Active" && styles.activeText]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("Completed")}
            style={[styles.tab, activeTab === "Completed" && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Completed" && styles.activeText,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            placeholder="Search name, type, date..."
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 50 }]}>S.No</Text>
                <Text style={[styles.tableHeaderText, { width: 200 }]}>Title</Text>
                <Text style={[styles.tableHeaderText, { width: 120 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { width: 150 }]}>
                  Created By
                </Text>
                <Text style={[styles.tableHeaderText, { width: 200 }]}>
                  Participants
                </Text>
                <Text style={[styles.tableHeaderText, { width: 100 }]}>Status</Text>
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.map((item, index) => (
                    <View key={item._id} style={styles.tableRow}>
                      <Text
                        style={[styles.tableCell, { width: 50 }]}
                        numberOfLines={1}
                      >
                        {index + 1}
                      </Text>
                      <Text
                        style={[styles.tableCell, { width: 200 }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatDate(item.date)}
                      </Text>
                      <Text
                        style={[styles.tableCell, { width: 150 }]}
                        numberOfLines={1}
                      >
                        {getUserName(item.createdBy)}
                      </Text>
                      <Text
                        style={[styles.tableCell, { width: 200 }]}
                        numberOfLines={2}
                      >
                        {getParticipantNames(item.participants)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {item.status}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.noData}>
                    <Text style={styles.noDataText}>
                      {searchQuery
                        ? "No meetings found matching your search."
                        : "No meetings available."}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  center: { justifyContent: "center", alignItems: "center" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorText: {
    fontSize: 16,
    color: "#FF0000",
    textAlign: "center",
    marginBottom: 10,
  },
  errorSubText: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  retryButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: { color: "#fff", fontWeight: "700" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  arrowContainer: {
    flexDirection: "row",
  },
  arrowButton: {
    marginLeft: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  createBtn: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createText: { color: "#fff", fontWeight: "600" },
  meetingCard: { width: 200, borderRadius: 12, padding: 16, marginRight: 12 },
  meetingTitle: { fontSize: 15, fontWeight: "bold" },
  meetingTime: { fontSize: 13, color: "#333", marginVertical: 6 },
  joinBtn: {
    backgroundColor: "#FF5722",
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignItems: "center",
  },
  joinText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  meetingDate: { fontSize: 12, color: "#444", marginTop: 8 },
  tabRow: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "#d9534f" },
  tabText: { fontSize: 14, color: "#666" },
  activeText: { color: "#d9534f", fontWeight: "600" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 40,
  },
  input: { flex: 1, padding: 8, fontSize: 14 },
  tableContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: 500,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  tableCell: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  noData: { padding: 20, alignItems: "center", justifyContent: "center" },
  noDataText: { fontSize: 16, color: "#888" },
  noMeetings: { padding: 20, width: width - 60, alignItems: "center" },
  noMeetingsText: { fontSize: 16, color: "#888" },
});

export default MeetingDashboard;