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
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../hooks/useAxios";
import AppHeader from "../components/AppHeader";

const { width } = Dimensions.get("window");

export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  client?: string;
  clientContact?: string;
  projectManager: string; // User ID
  teamMembers: string[]; // Array of User IDs
  status: ProjectStatus;
  priority: ProjectPriority;
  budget?: number;
  spent?: number;
  documents?: string;
  createdAt?: string;
  updatedAt?: string;
  // For UI compatibility
  task?: string;
  progress?: number;
  members?: string[];
}

// For form inputs that might not have all required fields
export type ProjectInput = Omit<Project, '_id' | 'createdAt' | 'updatedAt'> & {
  _id?: string;
};

// Function to generate avatar URLs
const generateAvatarUrl = (seed: string, size = 40) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&radius=22&size=${size}`;
};

const Dashboard = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const { callApi: callRealApi, loading: isLoading, error } = useAxios();

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await callRealApi({
          method: 'GET',
          url: '/projects',
        });
        
        console.log('API Response:', response);
        
        if (Array.isArray(response)) {
          setProjects(response);
          
          // Get recent projects (last 5 created)
          const sortedByDate = [...response].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          
          setRecentProjects(sortedByDate.slice(0, 5));
        } else {
          Alert.alert("Error", "Invalid project data received from server");
          console.log('Invalid project data from API');
        }
      } catch (error) {
        console.error('Error fetching projects from API:', error);
        Alert.alert("Error", "Failed to load projects. Please check your connection and try again.");
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "#E08C42";
      case "Pending": return "#FF5900";
      case "Completed": return "#FF0004";
      case "Not Started": return "#666";
      case "On Hold": return "#FFA500";
      case "Cancelled": return "#FF0000";
      default: return "#666";
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(search.toLowerCase()) ||
    (project.task && project.task.toLowerCase().includes(search.toLowerCase()))
  );

  // Function to handle project row click
  const handleProjectClick = (project: Project) => {
    navigation.navigate('ProjectOverview', { project });
  };

  if (isLoading) {
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

  // Count projects by status for the chart
  const inProgressCount = projects.filter(p => p.status === "In Progress").length;
  const notStartedCount = projects.filter(p => p.status === "Not Started").length;
  const completedCount = projects.filter(p => p.status === "Completed").length;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
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
      </View> */}
      <AppHeader navigation={navigation} />

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
              { name: "In Progress", population: inProgressCount, color: "#E08C42", legendFontColor: "#444", legendFontSize: 12 },
              { name: "Not Started", population: notStartedCount, color: "#FF5900", legendFontColor: "#444", legendFontSize: 12 },
              { name: "Completed", population: completedCount, color: "#FF0004", legendFontColor: "#444", legendFontSize: 12 },
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
            <Text style={styles.legendValue}>({inProgressCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF5900" }]} />
            <Text style={styles.legendText}>Not Started</Text>
            <Text style={styles.legendValue}>({notStartedCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF0004" }]} />
            <Text style={styles.legendText}>Completed</Text>
            <Text style={styles.legendValue}>({completedCount})</Text>
          </View>
        </View>
      </View>

      {/* Recent Projects with Card Background */}
      <View style={styles.recentProjectsCard}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <View key={project._id} style={styles.projectCard}>
                <View style={styles.projectCardHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                    <Text style={styles.statusText}>{project.status}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${project.progress || (project.status === "Completed" ? 100 : project.status === "Not Started" ? 0 : 50)}%` 
                  }]} />
                </View>
                <View style={styles.membersRow}>
                  {project.teamMembers && project.teamMembers.slice(0, 3).map((member, idx) => (
                    <Image 
                      key={idx} 
                      source={{ uri: generateAvatarUrl(member, 36) }} 
                      style={styles.memberPic} 
                    />
                  ))}
                  <Text style={styles.moreMembers}>
                    +{project.teamMembers ? Math.max(0, project.teamMembers.length - 3) : 0}
                  </Text>
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
          <Text style={styles.tableHead}>Status</Text>
          <Text style={styles.tableHead}>Priority</Text>
          <Text style={styles.tableHead}>Team</Text>
        </View>

        {filteredProjects.length > 0 ? (
          filteredProjects.map((p, index) => (
            <TouchableOpacity 
              key={p._id} 
              style={styles.tableRow}
              onPress={() => handleProjectClick(p)}
            >
              <Text style={styles.tableCell}>{index + 1}</Text>
              <Text style={styles.tableCell} numberOfLines={1}>{p.name}</Text>
              <View style={[styles.statusCell, { backgroundColor: getStatusColor(p.status) }]}>
                <Text style={styles.statusText}>{p.status}</Text>
              </View>
              <Text style={styles.tableCell}>{p.priority}</Text>
              <View style={styles.memberList}>
                {p.teamMembers && p.teamMembers.slice(0, 3).map((member, idx) => (
                  <Image 
                    key={idx} 
                    source={{ uri: generateAvatarUrl(member, 32) }} 
                    style={styles.memberPic} 
                  />
                ))}
                {p.teamMembers && p.teamMembers.length > 3 && (
                  <Text style={styles.moreMembers}>+{p.teamMembers.length - 3}</Text>
                )}
              </View>
            </TouchableOpacity>
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
    fontWeight: "600",
    fontSize: 12,
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
    justifyContent: "center",
    alignItems: "center",
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