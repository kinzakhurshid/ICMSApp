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

const { width } = Dimensions.get("window");

export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  id: string;
  // Add any other properties that might exist in the API response
}

export interface ProjectManager {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  id: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  client?: string;
  clientContact?: string;
  projectManager: ProjectManager;
  teamMembers: any[]; // Use any[] to be more flexible with API changes
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
  fileUrl?: string;
  organizationId?: string;
  sprintId?: string[];
  __v?: number;
}

// Function to generate avatar URLs using randomuser.me
const generateAvatarUrl = (index, size = 'medium') => {
  const sizes = {
    small: 'thumb',
    medium: 'portrait',
    large: 'large'
  };
  const gender = index % 2 === 0 ? 'men' : 'women';
  const id = index % 100; // Ensure we have a valid ID between 0-99
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
};

// Helper function to extract team members from API response
const extractTeamMembers = (project: any): TeamMember[] => {
  console.log("Extracting team members from:", project.teamMembers);
  
  if (!project.teamMembers || !Array.isArray(project.teamMembers)) {
    return [];
  }
  
  // Handle different possible formats
  return project.teamMembers.map((member: any, index: number) => {
    // Truncate very long names to prevent UI issues
    const truncateName = (name: string, maxLength = 20) => {
      if (!name) return 'User';
      return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    };
    
    if (typeof member === 'string') {
      // If team member is just a string ID
      return {
        _id: member,
        firstName: 'User',
        lastName: '',
        fullName: 'User',
        id: member
      };
    } else if (member && typeof member === 'object') {
      // If team member is an object - handle long names
      const firstName = truncateName(member.firstName || '');
      const lastName = truncateName(member.lastName || '');
      
      return {
        _id: member._id || member.id || `unknown-${index}`,
        firstName: firstName || 'User',
        lastName: lastName,
        fullName: truncateName(member.fullName || `${firstName} ${lastName}`.trim() || 'User'),
        id: member._id || member.id || `unknown-${index}`
      };
    }
    
    // Fallback for unexpected formats
    return {
      _id: `unknown-${index}`,
      firstName: 'User',
      lastName: '',
      fullName: 'User',
      id: `unknown-${index}`
    };
  });
};

const Dashboard = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [weeklyProjects, setWeeklyProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    Completed: 0,
    'In Progress': 0,
    'Not Started': 0,
    'On Hold': 0,
    Cancelled: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const { callApi: callRealApi, loading: isLoading, error } = useAxios();

  // Fetch weekly projects (same as website)
  const fetchWeeklyProjects = async () => {
    try {
      const response = await callRealApi({
        method: 'GET',
        url: '/projects/weekly',
      });

      if (response?.success) {
        setWeeklyProjects(prev => [...response.data.weekProjects, ...response.data.overdueProjects]);
      } else {
        setWeeklyProjects([]);
      }
    } catch (error) {
      console.error('Error fetching weekly projects:', error);
      setWeeklyProjects([]);
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await callRealApi({
          method: 'GET',
          url: '/projects?page=1&limit=10&search=&status=',
        });
        
        console.log('Full API Response:', JSON.stringify(response, null, 2));
        
        // Handle the correct API response structure (same as website)
        if (response?.success && Array.isArray(response.data)) {
          // Process projects to ensure team members are properly formatted
          const processedProjects = response.data.map(project => ({
            ...project,
            // Ensure teamMembers is always an array of proper objects
            teamMembers: extractTeamMembers(project)
          }));
          
          setProjects(processedProjects);
          
          // Set stats and pagination (same as website)
          if (response.stats) {
            setStats(response.stats);
          }
          
          if (response.pagination) {
            setPagination(response.pagination);
          }
          
          // Get recent projects (last 5 created)
          const sortedByDate = [...processedProjects].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          
          setRecentProjects(sortedByDate.slice(0, 5));
        } else if (Array.isArray(response)) {
          // Fallback for direct array response (old format)
          console.log('Using fallback array format');
          const processedProjects = response.map(project => ({
            ...project,
            teamMembers: extractTeamMembers(project)
          }));
          
          setProjects(processedProjects);
          
          // Get recent projects (last 5 created)
          const sortedByDate = [...processedProjects].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          
          setRecentProjects(sortedByDate.slice(0, 5));
        } else {
          Alert.alert("Error", "Invalid project data received from server");
          console.log('Invalid project data from API:', response);
        }
      } catch (error) {
        console.error('Error fetching projects from API:', error);
        Alert.alert("Error", "Failed to load projects. Please check your connection and try again.");
      }
    };

    fetchProjects();
    fetchWeeklyProjects();
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
    navigation.navigate('ProjectDetail', { projectId: project._id });
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

  // Use stats from API response (same as website)
  const inProgressCount = stats['In Progress'] || 0;
  const notStartedCount = stats['Not Started'] || 0;
  const completedCount = stats['Completed'] || 0;
  const onHoldCount = stats['On Hold'] || 0;
  const cancelledCount = stats['Cancelled'] || 0;

  return (
    <ScrollView style={styles.container}>
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
              { name: "Completed", population: completedCount, color: "#00C851", legendFontColor: "#444", legendFontSize: 12 },
              { name: "On Hold", population: onHoldCount, color: "#FFA500", legendFontColor: "#444", legendFontSize: 12 },
              { name: "Cancelled", population: cancelledCount, color: "#FF0000", legendFontColor: "#444", legendFontSize: 12 },
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
            <View style={[styles.legendDot, { backgroundColor: "#00C851" }]} />
            <Text style={styles.legendText}>Completed</Text>
            <Text style={styles.legendValue}>({completedCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FFA500" }]} />
            <Text style={styles.legendText}>On Hold</Text>
            <Text style={styles.legendValue}>({onHoldCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF0000" }]} />
            <Text style={styles.legendText}>Cancelled</Text>
            <Text style={styles.legendValue}>({cancelledCount})</Text>
          </View>
        </View>
      </View>

      {/* Recent Projects with Card Background */}
      <View style={styles.recentProjectsCard}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentProjects.length > 0 ? (
            recentProjects.map((project, projectIndex) => {
              const teamMembersCount = project.teamMembers ? project.teamMembers.length : 0;
              
              return (
                <View key={project._id} style={styles.projectCard}>
                  <View style={styles.projectCardHeader}>
                    <Text 
                      style={styles.projectName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {project.name}
                    </Text>
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
                    {teamMembersCount > 0 ? (
                      <>
                        {project.teamMembers.slice(0, 3).map((member, idx) => {
                          const avatarUrl = generateAvatarUrl((projectIndex * 3) + idx);
                          return (
                            <Image 
                              key={member._id || idx} 
                              source={{ uri: avatarUrl }} 
                              style={styles.memberPic}
                              defaultSource={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                              onError={() => {
                                console.log('Image load error for:', avatarUrl);
                              }}
                            />
                          );
                        })}
                        {teamMembersCount > 3 && (
                          <Text style={styles.moreMembers}>
                            +{teamMembersCount - 3}
                          </Text>
                        )}
                      </>
                    ) : (
                      <View style={styles.noMembersContainer}>
                        <Text style={styles.noMembersText}>No team members</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
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
          <Text style={[styles.tableHead, {flex: 0.5}]}>No#</Text>
          <Text style={[styles.tableHead, {flex: 1.5}]}>Project Name</Text>
          <Text style={[styles.tableHead, {flex: 1}]}>Status</Text>
          <Text style={[styles.tableHead, {flex: 1}]}>Priority</Text>
          <Text style={[styles.tableHead, {flex: 1}]}>Team</Text>
        </View>

        {filteredProjects.length > 0 ? (
          filteredProjects.map((p, index) => {
            const teamMembersCount = p.teamMembers ? p.teamMembers.length : 0;
            
            return (
              <TouchableOpacity 
                key={p._id} 
                style={styles.tableRow}
                onPress={() => handleProjectClick(p)}
              >
                <Text style={[styles.tableCell, {flex: 0.5}]}>{index + 1}</Text>
                <Text style={[styles.tableCell, {flex: 1.5}]} numberOfLines={1}>{p.name}</Text>
                <View style={[styles.statusCell, { backgroundColor: getStatusColor(p.status), flex: 1 }]}>
                  <Text style={styles.statusText}>{p.status}</Text>
                </View>
                <Text style={[styles.tableCell, {flex: 1}]}>{p.priority}</Text>
                <View style={[styles.memberList, {flex: 1}]}>
                  {teamMembersCount > 0 ? (
                    <>
                      {p.teamMembers.slice(0, 3).map((member, idx) => {
                        const avatarUrl = generateAvatarUrl((index * 3) + idx);
                        return (
                          <Image 
                            key={member._id || idx} 
                            source={{ uri: avatarUrl }} 
                            style={styles.memberPic}
                            defaultSource={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                            onError={() => {
                              console.log('Image load error for:', avatarUrl);
                            }}
                          />
                        );
                      })}
                      {teamMembersCount > 3 && (
                        <Text style={styles.moreMembers}>+{teamMembersCount - 3}</Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.noMembersTextSmall}>None</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
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
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#1F2937",
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
    color: "#1F2937",
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
    alignItems: "flex-start",
    marginBottom: 8,
  },
  projectName: { 
    fontWeight: "600", 
    fontSize: 14, 
    color: "#1F2937",
    flex: 1, 
    marginRight: 8,
    maxWidth: '65%',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
    alignItems: "center",
    minHeight: 30,
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
  noMembersContainer: {
    paddingVertical: 5,
  },
  noMembersText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
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
    fontSize: 12,
    color: "#1F2937",
    textAlign: "center",
    fontWeight: "500",
  },
  memberList: { 
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statusCell: {
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
  noMembersTextSmall: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
});

export default Dashboard;