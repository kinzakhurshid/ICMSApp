import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";

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

// Mock API function to fetch project details
const fetchProjectDetailsFromAPI = async (projectId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate API response with detailed project data
      const projects = {
        1: {
          _id: "68948c3873cbdbceb17f1690",
          name: "Maxima Smalls",
          description: "UI design project for Maxima Smalls",
          startDate: "2025-08-01T00:00:00.000Z",
          endDate: "2025-08-31T00:00:00.000Z",
          client: "Maxima Corporation",
          clientContact: "123-456-7890",
          organizationId: "68873dffd01c959ffdc02331",
          projectManager: {
            _id: "6888a44799e85af3c5c4501b",
            firstName: "Mamoona",
            lastName: "Khan",
            email: "mamoonakhan@company.com",
            fullName: "Mamoona Khan",
          },
          teamMembers: [
            {
              _id: "689457115f1377ed51a8aa78",
              firstName: "Hamza",
              lastName: "Habib",
              email: "hamza@intelgency.com",
              fullName: "Hamza Habib",
            },
            {
              _id: "689455075f1377ed51a8aa5b",
              firstName: "Farhan-ullah",
              lastName: "Salih Muhammad",
              email: "farhan@intelgency.com",
              fullName: "Farhan-ullah Salih Muhammad",
            }
          ],
          status: "In Progress",
          priority: "Medium",
          budget: 10000,
          spent: 4500,
          fileUrl: "http://localhost:5000/uploads/1754565688022-Group.png",
          createdAt: "2025-08-07T11:21:28.063Z",
          updatedAt: "2025-08-21T07:51:28.900Z",
          completeDate: null,
        },
        2: {
          _id: "68948c3873cbdbceb17f1691",
          name: "Ghiorghi",
          description: "Backend development for Ghiorghi platform",
          startDate: "2025-09-01T00:00:00.000Z",
          endDate: "2025-10-15T00:00:00.000Z",
          client: "Ghiorghi Inc",
          clientContact: "098-765-4321",
          organizationId: "68873dffd01c959ffdc02331",
          projectManager: {
            _id: "6888a44799e85af3c5c4501c",
            firstName: "John",
            lastName: "Smith",
            email: "john@company.com",
            fullName: "John Smith",
          },
          teamMembers: [
            {
              _id: "689457115f1377ed51a8aa79",
              firstName: "Alice",
              lastName: "Johnson",
              email: "alice@intelgency.com",
              fullName: "Alice Johnson",
            },
            {
              _id: "689455075f1377ed51a8aa5c",
              firstName: "Bob",
              lastName: "Williams",
              email: "bob@intelgency.com",
              fullName: "Bob Williams",
            }
          ],
          status: "Pending",
          priority: "High",
          budget: 15000,
          spent: 2000,
          fileUrl: "http://localhost:5000/uploads/1754565688022-Group2.png",
          createdAt: "2025-08-10T11:21:28.063Z",
          updatedAt: "2025-08-22T07:51:28.900Z",
          completeDate: null,
        },
        // Add more projects as needed
      };
      
      resolve(projects[projectId] || projects[1]);
    }, 1000);
  });
};

// Mock API function to fetch tasks
const fetchTasksFromAPI = async (projectId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        tasks: [
          { id: 1, name: "Design Homepage", assignee: "Maira Khan", status: "Completed", dueDate: "2025-08-15" },
          { id: 2, name: "Implement API", assignee: "Waseem Khan", status: "In Progress", dueDate: "2025-08-25" },
          { id: 3, name: "Testing", assignee: "Hamza Habib", status: "Pending", dueDate: "2025-08-30" },
        ]
      });
    }, 800);
  });
};

const ProjectOverview = ({ route }) => {
  const navigation = useNavigation();
  const { project: initialProject } = route.params || {};
  const [activeTab, setActiveTab] = useState("details");
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const { callApi, loading, error } = useApi();

  // If project wasn't passed (direct navigation), fetch it by ID
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        // In a real app, you would get the project ID from route.params
        const response = await callApi(() => fetchProjectDetailsFromAPI(1));
        setProject(response);
      } catch (err) {
        console.error('Failed to load project details', err);
      }
    };

    const fetchTasks = async () => {
      try {
        setTaskLoading(true);
        // In a real app, you would get the project ID from route.params
        const response = await callApi(() => fetchTasksFromAPI(1));
        setTasks(response.tasks || []);
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setTaskLoading(false);
      }
    };

    if (!project) {
      fetchProjectDetails();
    }
    
    if (project) {
      fetchTasks();
    }
  }, [project]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate budget utilization
  const calculateBudgetUtilization = () => {
    if (!project || !project.budget || !project.spent) return '0%';
    const utilization = (project.spent / project.budget) * 100;
    return `${utilization.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
       <AppHeader navigation={navigation} />
      <View style={styles.header}>
        <Text style={styles.title}>Project Overview</Text>
        <Text style={styles.subText}>{project.name}</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.completeBtn}>
            <Text style={styles.completeText}>Mark Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color="#000" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.badge}>{project.priority || 'Medium'} Priority</Text>
          <Text style={styles.status}>{project.status || 'Not Started'}</Text>
        </View>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.description}>{project.description || 'No description available'}</Text>
      </View>

      {/* Project Details Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "details" && styles.activeTab]} 
          onPress={() => setActiveTab("details")}
        >
          <Text style={[styles.tabText, activeTab === "details" && styles.activeTabText]}>Project Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "tasks" && styles.activeTab]} 
          onPress={() => setActiveTab("tasks")}
        >
          <Text style={[styles.tabText, activeTab === "tasks" && styles.activeTabText]}>Tasks ({tasks.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "details" ? (
        <>
          {/* Details Section with Icons */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="wallet-outline" size={20} color="#FF6B35" />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Total Budget</Text>
                <Text style={styles.value}>${project.budget ? project.budget.toLocaleString() : '0'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color="#FF6B35" />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Amount Spent</Text>
                <Text style={styles.value}>${project.spent ? project.spent.toLocaleString() : '0'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color="#FF6B35" />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Team Members</Text>
                <Text style={styles.value}>{project.teamMembers ? project.teamMembers.length : '0'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="pie-chart-outline" size={20} color="#FF6B35" />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Budget Utilization</Text>
                <Text style={styles.value}>{calculateBudgetUtilization()}</Text>
              </View>
            </View>
          </View>

          {/* Project Team */}
          <Text style={styles.sectionTitle}>Project Team</Text>
          <View style={[styles.teamCard, styles.shadowCard]}>
            <Text style={styles.teamLabel}>Project Manager</Text>
            {project.projectManager ? (
              <View style={styles.teamItem}>
                <View style={[styles.avatar, { backgroundColor: "#FF6B35" }]}>
                  <Text style={styles.avatarText}>
                    {project.projectManager.firstName?.[0]}{project.projectManager.lastName?.[0]}
                  </Text>
                </View>
                <Text style={styles.teamName}>{project.projectManager.fullName}</Text>
              </View>
            ) : (
              <Text style={styles.noDataText}>No project manager assigned</Text>
            )}
            
            <Text style={styles.teamLabel}>Team Members</Text>
            {project.teamMembers && project.teamMembers.length > 0 ? (
              project.teamMembers.map((member, index) => (
                <View key={index} style={styles.teamItem}>
                  <View style={[styles.avatar, { backgroundColor: "#ddd" }]}>
                    <Text style={styles.avatarText}>
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </Text>
                  </View>
                  <Text style={styles.teamName}>{member.fullName}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No team members assigned</Text>
            )}
          </View>

          {/* Client Info */}
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={[styles.clientCard, styles.shadowCard]}>
            <Text style={styles.label}>Company</Text>
            <Text style={styles.value}>{project.client || 'Not specified'}</Text>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>{project.clientContact || 'Not specified'}</Text>
            <Text style={styles.label}>Timeline</Text>
            <Text style={styles.value}>
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </Text>
          </View>

          {/* Documents & Details with additional fields */}
          <Text style={styles.sectionTitle}>Documents & Details</Text>
          <View style={[styles.docCard, styles.shadowCard]}>
            {project.fileUrl ? (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.docText}>Project Document</Text>
                  <Ionicons name="download-outline" size={22} color="#ff6600" />
                </View>
                <Text style={styles.docDate}>Created {formatDate(project.createdAt)}</Text>
              </>
            ) : (
              <Text style={styles.noDataText}>No documents uploaded</Text>
            )}
            
            <View style={styles.docDetailRow}>
              <Ionicons name="time-outline" size={16} color="#777" />
              <Text style={styles.docDetailText}>Last Updated: {formatDate(project.updatedAt)}</Text>
            </View>
            
            <View style={styles.docDetailRow}>
              <Ionicons name="calendar-outline" size={16} color="#777" />
              <Text style={styles.docDetailText}>Completed On: {formatDate(project.completeDate) || '-'}</Text>
            </View>
            
            <View style={styles.docDetailRow}>
              <Ionicons name="flag-outline" size={16} color="#777" />
              <Text style={styles.docDetailText}>Priority: {project.priority || 'Not specified'}</Text>
            </View>
            
            <View style={styles.docDetailRow}>
              <Ionicons name="stats-chart-outline" size={16} color="#777" />
              <Text style={styles.docDetailText}>Status: {project.status || 'Not specified'}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.tasksContainer}>
          <Text style={styles.sectionTitle}>Project Tasks</Text>
          <View style={[styles.tableCard, styles.shadowCard]}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Task Name</Text>
              <Text style={styles.tableHeaderText}>Assignee</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Due Date</Text>
            </View>
            
            {taskLoading ? (
              <View style={styles.tableRow}>
                <ActivityIndicator size="small" color="#FF6B00" />
              </View>
            ) : tasks.length > 0 ? (
              tasks.map((task, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{task.name}</Text>
                  <Text style={styles.tableCell}>{task.assignee || 'Unassigned'}</Text>
                  <Text style={styles.tableCell}>{task.status || 'Not Started'}</Text>
                  <Text style={styles.tableCell}>{formatDate(task.dueDate)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>No tasks available</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 15 },
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
  header: { marginBottom: 15, marginTop: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 5 },
  subText: { color: "#555", marginBottom: 15 },
  btnRow: { 
    flexDirection: "row", 
    gap: 10, 
    justifyContent: "flex-end",
    marginTop: 5
  },
  completeBtn: {
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  completeText: { color: "#fff", fontWeight: "bold" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editText: { marginLeft: 5, color: "#000" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  badge: { color: "#FF6B35", fontWeight: "600" },
  status: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    color: "#444",
  },
  projectName: { fontWeight: "bold", fontSize: 20, marginTop: 10, marginBottom: 5 },
  description: { color: "#666", marginTop: 3 },

  tabRow: { 
    flexDirection: "row", 
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  tab: { 
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 5
  },
  tabText: {
    fontWeight: "600", 
    color: "#777",
    fontSize: 15
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: "#FF6B35" 
  },
  activeTabText: { 
    color: "#FF6B35" 
  },

  detailCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailContent: {
    marginLeft: 12,
  },
  label: { color: "#555", fontSize: 14, marginBottom: 5 },
  value: { fontSize: 16, fontWeight: "bold", color: "#000" },

  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginVertical: 15,
    color: "#333"
  },
  
  shadowCard: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  
  teamCard: { 
    padding: 15, 
    borderRadius: 12,
    marginBottom: 15
  },
  teamLabel: { 
    fontSize: 14, 
    fontWeight: "600", 
    marginTop: 10,
    marginBottom: 8,
    color: "#555"
  },
  teamItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 8,
    marginBottom: 5
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "bold" },
  teamName: { fontSize: 16, color: "#000" },
  noDataText: {
    color: "#777",
    fontStyle: "italic",
    marginVertical: 10,
  },

  clientCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  docCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  docText: { fontWeight: "600", fontSize: 15, marginBottom: 5 },
  docDate: { marginTop: 5, color: "#777", marginBottom: 15 },
  docDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  docDetailText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 14,
  },
  
  tasksContainer: {
    marginBottom: 20
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    color: "#555"
  },
  tableRow: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  tableCell: {
    flex: 1,
    color: "#777",
    textAlign: "center"
  }
});

export default ProjectOverview;