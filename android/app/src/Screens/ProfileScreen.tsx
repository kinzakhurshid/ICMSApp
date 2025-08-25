import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// Function to generate avatar URLs
const generateAvatarUrl = (seed, size = 40) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&radius=22&size=${size}`;
};

// Mock API service function
const fetchProjectsFromAPI = async () => {
  // Simulating API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          projects: [
            { id: 1, name: "Maxima Smalls", task: "UI Design", members: ["alice", "bob"], status: "In Progress" },
            { id: 2, name: "Ghiorghi", task: "Backend Development", members: ["charlie", "diana"], status: "Pending" },
            { id: 3, name: "Mia Bramburg", task: "Testing", members: ["edward", "fiona"], status: "Completed" },
            { id: 4, name: "E-commerce Platform", task: "Frontend Development", members: ["grace", "henry"], status: "In Progress" },
            { id: 5, name: "Mobile Banking App", task: "Security Implementation", members: ["ivy", "jack"], status: "Pending" },
          ],
          recentProjects: [
            { id: 1, name: "Website Redesign", progress: 80, members: ["john", "mary"], status: "In Progress" },
            { id: 2, name: "Mobile App", progress: 40, members: ["steve", "lisa"], status: "Pending" },
            { id: 3, name: "API Integration", progress: 20, members: ["dave", "sarah"], status: "Completed" }
          ]
        }
      });
    }, 1500); // Simulate network delay
  });
};

// Custom hook for API calls
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiFunction) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction();
      return response;
    } catch (err) {
      setError(err.message || "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error };
};

const Dashboard = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const { callApi, loading, error } = useApi();

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await callApi(fetchProjectsFromAPI);
        
        // Safely access the response data
        if (response && response.data) {
          setProjects(response.data.projects || []);
          setRecentProjects(response.data.recentProjects || []);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`,
    strokeWidth: 2,
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress": return "#E08C42";
      case "Pending": return "#FF5900";
      case "Completed": return "#FF0004";
      default: return "#666";
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(search.toLowerCase()) ||
    (project.task && project.task.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: generateAvatarUrl("mamoona", 40) }} 
            style={styles.profilePic} 
          />
          <Text style={styles.greeting}>Hi, Mamoona</Text>
        </View>
        <View style={styles.headerIcons}>
          <Ionicons name="chatbubble-outline" size={24} color="#333" style={{ marginRight: 15 }} />
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Projects</Text>

      {/* Chart Section as Card with Create Button */}
      <View style={styles.chartCard}>
        {/* Create Button in top right corner */}
        <View style={styles.createBtnWrapper}>
          <TouchableOpacity 
            style={styles.createBtn} 
            onPress={() => navigation.navigate('CreateProject')}
          >
            <Text style={styles.createBtnText}>Create Project</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartContainer}>
          <PieChart
            data={[
              { name: "In Progress", population: projects.filter(p => p.status === "In Progress").length, color: "#E08C42", legendFontColor: "#444", legendFontSize: 12 },
              { name: "Pending", population: projects.filter(p => p.status === "Pending").length, color: "#FF5900", legendFontColor: "#444", legendFontSize: 12 },
              { name: "Completed", population: projects.filter(p => p.status === "Completed").length, color: "#FF0004", legendFontColor: "#444", legendFontSize: 12 },
            ]}
            width={width * 0.9}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[0, 0]}
            absolute
            hasLegend={false}
          />
        </View>

        {/* Legends */}
        <View style={styles.legends}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E08C42" }]} />
            <Text style={styles.legendText}>In Progress</Text>
            <Text style={styles.legendValue}>({projects.filter(p => p.status === "In Progress").length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF5900" }]} />
            <Text style={styles.legendText}>Pending</Text>
            <Text style={styles.legendValue}>({projects.filter(p => p.status === "Pending").length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF0004" }]} />
            <Text style={styles.legendText}>Completed</Text>
            <Text style={styles.legendValue}>({projects.filter(p => p.status === "Completed").length})</Text>
          </View>
        </View>
      </View>

      {/* Recent Projects with Card Background */}
      <View style={styles.recentProjectsCard}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectCardHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                    <Text style={styles.statusText}>{project.status}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${project.progress || 0}%` }]} />
                </View>
                <View style={styles.membersRow}>
                  {project.members && project.members.map((member, idx) => (
                    <Image 
                      key={idx} 
                      source={{ uri: generateAvatarUrl(member, 36) }} 
                      style={styles.memberPic} 
                    />
                  ))}
                  <Text style={styles.moreMembers}>+{project.members ? project.members.length : 0}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noProjects}>
              <Text style={styles.noProjectsText}>No recent projects</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* My Projects */}
      <View style={styles.myProjects}>
        <Text style={styles.sectionTitle}>My Projects</Text>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search Task"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="search" size={22} style={styles.searchIcon} />
          <MaterialIcons name="filter-list" size={22} style={styles.filterIcon} />
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHead}>No#</Text>
          <Text style={styles.tableHead}>Project Name</Text>
          <Text style={styles.tableHead}>Task Name</Text>
          <Text style={styles.tableHead}>Assignee</Text>
          <Text style={styles.tableHead}>Status</Text>
        </View>

        {filteredProjects.length > 0 ? (
          filteredProjects.map((p, index) => (
            <View key={p.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{index + 1}</Text>
              <Text style={styles.tableCell}>{p.name}</Text>
              <Text style={styles.tableCell}>{p.task}</Text>
              <View style={styles.memberList}>
                {p.members && p.members.map((member, idx) => (
                  <Image 
                    key={idx} 
                    source={{ uri: generateAvatarUrl(member, 32) }} 
                    style={styles.memberPic} 
                  />
                ))}
              </View>
              <View style={[styles.statusCell, { backgroundColor: getStatusColor(p.status) }]}>
                <Text style={styles.statusText}>{p.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
              {search ? "No projects found matching your search." : "No projects available."}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#FF0000",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 15,
    paddingTop: 30,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  greeting: { fontSize: 16, fontWeight: "600" },
  headerIcons: { flexDirection: "row" },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    paddingHorizontal: 15, 
    marginTop: 10 
  },
  chartCard: {
    position: "relative",
    marginVertical: 15,
    marginHorizontal: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  createBtnWrapper: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  createBtn: { 
    backgroundColor: "#FF6B00", 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 12,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
   legends: {
    position: "absolute",
    right: 30,
    top: "40%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
  },
  recentProjectsCard: {
    marginVertical: 15,
    marginHorizontal: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 10, 
    color: "#FF6B00" 
  },
  projectCard: { 
    backgroundColor: "#f9f9f9", 
    borderRadius: 10, 
    padding: 10, 
    marginRight: 10, 
    width: width * 0.6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  projectCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectName: { fontWeight: "600", fontSize: 14 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  progressBar: { 
    height: 8, 
    backgroundColor: "#ddd", 
    borderRadius: 5, 
    marginVertical: 10 
  },
  progressFill: { 
    height: 8, 
    backgroundColor: "#FF6B00", 
    borderRadius: 5 
  },
  membersRow: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  memberPic: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    marginRight: -5,
    borderWidth: 2,
    borderColor: "#fff"
  },
  moreMembers: { 
    marginLeft: 10, 
    color: "#FF6B00", 
    fontWeight: "600" 
  },
  myProjects: { 
    padding: 15,
    marginTop: 10,
  },
  searchRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 15,
    position: "relative"
  },
  searchInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    paddingLeft: 10, 
    height: 40,
    paddingRight: 80
  },
  searchIcon: { 
    position: "absolute", 
    right: 40, 
    color: "#555" 
  },
  filterIcon: { 
    marginLeft: 10, 
    color: "#555" 
  },
  tableHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    borderBottomWidth: 1, 
    borderBottomColor: "#ccc", 
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableHead: { 
    flex: 1, 
    fontWeight: "700", 
    fontSize: 12,
    textAlign: "center",
  },
  tableRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee" 
  },
  tableCell: { 
    flex: 1, 
    fontSize: 12,
    textAlign: "center",
  },
  memberList: { 
    flexDirection: "row",
    flex: 1,
    justifyContent: "center"
  },
  statusCell: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  noResults: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  noProjects: {
    padding: 20,
    alignItems: "center",
    width: width * 0.6,
  },
  noProjectsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default Dashboard;