import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/DrawerNavigator";
import Ionicons from "react-native-vector-icons/Ionicons";
import AntDesign from "react-native-vector-icons/AntDesign";
import useAxios from "../hooks/useAxios";
import AppHeader from "../components/AppHeader";
import { useSelector } from "react-redux";
import { RootState } from "../states/store";

// Get screen width for responsive design
const { width } = Dimensions.get('window');

// Updated interfaces (kept flexible to match backend)
interface Project {
  _id?: string;
  name?: string;
  priority?: string;
}

interface Sprint {
  _id: string;
  id?: string;
  name: string;
  // Backend may return a single project object, an array, or IDs
  projectId?: any;
  projects?: any;
  project?: any;
  projectIds?: any;
  projectInfo?: any;
  startDate?: string;
  endDate?: string;
  started?: boolean;
  completed?: boolean;
}

interface SprintStats {
  totalSprints: number;
  activeSprints: number;
  completedSprints: number;
}

type SprintNavigationProp = DrawerNavigationProp<DrawerParamList, 'SprintBoard'>;

const SprintBoard = () => {
  const navigation = useNavigation<SprintNavigationProp>();
  const [searchText, setSearchText] = useState<string>("");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { callApi, error } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  
  // Function to handle create sprint button press
  const handleCreateSprint = () => {
    (navigation as any).navigate('CreateSprint');
  };

  // Normalise projects from a sprint into a Project[] for rendering
  const normalizeProjectsFromSprint = (sprint: Sprint): Project[] => {
    const raw =
      sprint.projectId ??
      sprint.projects ??
      sprint.project ??
      sprint.projectIds ??
      sprint.projectInfo;

    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw.filter(Boolean) as Project[];
    }

    if (typeof raw === 'object') {
      return [raw as Project];
    }

    // If it's just an ID string/number, we can't resolve name/priority here
    return [];
  };

  // Function to get project names as comma-separated string
  const getProjectNames = (sprint: Sprint): string => {
    const projects = normalizeProjectsFromSprint(sprint);
    if (!projects.length) return "N/A";
    return projects
      .map(project => project.name || '')
      .filter(Boolean)
      .join(", ");
  };

  // Function to get priorities as comma-separated string
  const getPriorities = (sprint: Sprint): string => {
    const projects = normalizeProjectsFromSprint(sprint);
    if (!projects.length) return "N/A";
    const priorities = projects.map(project => project.priority || "Medium");
    return Array.from(new Set(priorities)).join(", "); // Remove duplicates
  };

  // Fetch sprint data
  const fetchSprintData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await callApi({
        method: "GET",
        url: `/sprints/organization/${currentUser?.organization}/dashboard`,
      });
      
      if (statsResponse && statsResponse.data) {
        setStats(statsResponse.data as SprintStats);
      }
      
      // Fetch all sprints
      const sprintsResponse = await callApi({
        method: "GET",
        url: `/sprints/organization/${currentUser?.organization}`,
      });
      
      if (__DEV__) {
        console.log('🔍 SprintScreen - raw sprintsResponse:', JSON.stringify(sprintsResponse, null, 2));
      }

      if (sprintsResponse && Array.isArray(sprintsResponse.data)) {
        setSprints(sprintsResponse.data as Sprint[]);
      } else if (Array.isArray(sprintsResponse)) {
        setSprints(sprintsResponse as Sprint[]);
      }
      
    } catch (error) {
      console.error("Error loading sprint data:", error);
      Alert.alert("Error", "Failed to load sprint data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintData();
  }, []);

  // Filter sprints based on search text
  const filteredSprints = sprints.filter((sprint) =>
    sprint.name.toLowerCase().includes(searchText.toLowerCase()) ||
    getProjectNames(sprint).toLowerCase().includes(searchText.toLowerCase())
  );

  const renderSprint = ({ item, index }: { item: Sprint; index: number }) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={() => (navigation as any).navigate('SprintDetailNew', { sprintId: item._id })}
    >
      <Text style={[styles.cell, styles.srCell]} numberOfLines={1}>
        {index + 1}
      </Text>
      <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.cell, styles.projectCell]} numberOfLines={2}>
        {getProjectNames(item) || 'N/A'}
      </Text>
      <Text style={[styles.cell, styles.priorityCell]} numberOfLines={1}>
        {getPriorities(item)}
      </Text>
      <Text style={[styles.cell, styles.dateCell]}>
        {item.startDate ? new Date(item.startDate).toLocaleDateString() : "N/A"}
      </Text>
      <Text style={[styles.cell, styles.dateCell]}>
        {item.endDate ? new Date(item.endDate).toLocaleDateString() : "N/A"}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading sprint data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Error loading data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSprintData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sprint Board</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateSprint}>
          <Text style={styles.createBtnText}>Create Sprint</Text>
        </TouchableOpacity>
      </View>

      {/* Overview Section */}
      <View style={styles.overview}>
        <View style={styles.card}>
          <Ionicons name="layers-outline" size={24} color="#2563eb" />
          <Text style={styles.cardTitle}>Total Sprints</Text>
          <Text style={styles.cardNumber}>
            {stats?.totalSprints ?? sprints.length}
          </Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="play-circle-outline" size={24} color="green" />
          <Text style={styles.cardTitle}>Active</Text>
          <Text style={styles.cardNumber}>
            {stats?.activeSprints ?? sprints.filter(s => s.started && !s.completed).length}
          </Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="checkmark-circle-outline" size={24} color="green" />
          <Text style={styles.cardTitle}>Completed</Text>
          <Text style={styles.cardNumber}>
            {stats?.completedSprints ?? sprints.filter(s => s.completed).length}
          </Text>
        </View>
      </View>

      {/* Sprint List */}
      <Text style={styles.sectionTitle}>My Sprints</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Sprint or Project"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.iconBtn}>
          <AntDesign name="filter" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Table Container with Horizontal Scroll */}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Table Header */}
            <View style={[styles.row, styles.tableHeader]}>
              <Text style={[styles.headerCell, styles.srCell]}>SR#</Text>
              <Text style={[styles.headerCell, styles.nameCell]}>SPRINT NAME</Text>
              <Text style={[styles.headerCell, styles.projectCell]}>PROJECT</Text>
              <Text style={[styles.headerCell, styles.priorityCell]}>PRIORITY</Text>
              <Text style={[styles.headerCell, styles.dateCell]}>START DATE</Text>
              <Text style={[styles.headerCell, styles.dateCell]}>END DATE</Text>
            </View>

            {/* Table Data */}
            {filteredSprints.length > 0 ? (
              <FlatList
                data={filteredSprints}
                keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                renderItem={({ item, index }) => renderSprint({ item, index })}
                scrollEnabled={false} // Disable vertical scrolling in the inner FlatList
              />
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>
                  {searchText ? "No sprints found matching your search" : "No sprints available"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  createBtn: {
    backgroundColor: "#f97316",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createBtnText: { color: "#fff", fontWeight: "bold" },
  overview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#fff8f0",
    borderRadius: 12,
    padding: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: { fontSize: 13, color: "#666", marginTop: 5 },
  cardNumber: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 3 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  iconBtn: {
    marginLeft: 8,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minWidth: width * 1.5, // Make the table wider for better spacing
  },
  tableHeader: { 
    backgroundColor: "#f3f4f6",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cell: { 
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: "#333",
    textAlign: "center",
  },
  headerCell: { 
    fontWeight: "bold", 
    color: "#111",
    paddingVertical: 12,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  // Column width styles
  srCell: {
    width: 50,
  },
  nameCell: {
    width: 150,
  },
  projectCell: {
    width: 200,
  },
  priorityCell: {
    width: 100,
  },
  dateCell: {
    width: 120,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#f97316",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noData: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: width * 1.5,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});

export default SprintBoard;