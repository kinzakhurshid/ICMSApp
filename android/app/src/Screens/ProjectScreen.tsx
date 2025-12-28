import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useAxios from "../hooks/useAxios";
import { ProjectStackParamList } from "../navigation/PMTabNavigator";
import DonutChart from "../components/DonutChart";
import ProjectCard from "../components/ProjectCard";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
 

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

type ProjectScreenNavigationProp = NativeStackNavigationProp<ProjectStackParamList>;

const Dashboard = () => {
  const navigation = useNavigation<ProjectScreenNavigationProp>();
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
  const { callApi: callRealApi } = useAxios();
  // Keep a loading flag but don't block the whole screen with it
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(''); // simple status filter
  
  // Carousel refs - must be declared before any early returns
  const carouselRef = useRef<FlatList>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };
  
  // Toggle all projects selection
  const toggleAllProjects = () => {
    if (selectedProjects.size === filteredProjects.length && filteredProjects.length > 0) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p._id)));
    }
  };
  
  // Handle export
  const handleExport = () => {
    if (selectedProjects.size === 0) {
      Alert.alert('No Selection', 'Please select projects to export');
      return;
    }
    // For now, just show an alert - you can implement CSV/Excel export later
    Alert.alert('Export', `Exporting ${selectedProjects.size} project(s)...`);
  };
  
  // Handle filter button (just toggles visibility of simple status filters)
  const handleFilter = () => {
    setShowFilters(prev => !prev);
  };
  
  // Handle add project
  const handleAddProject = () => {
    // Pass context so CreateProjectScreen can navigate back correctly
    (navigation as any).navigate('CreateProject', { from: 'PMProjects' });
  };

  // Fetch weekly projects (same as website)
  const fetchWeeklyProjects = async () => {
    try {
      console.log('🔶 [ProjectScreen] fetchWeeklyProjects: starting request');
      const response = await callRealApi({
        method: 'GET',
        url: '/projects/weekly',
      });

      if (response) {
        const payload: any = response.data ?? response;
        const weekProjects = payload.weekProjects ?? payload.data?.weekProjects ?? [];
        const overdueProjects = payload.overdueProjects ?? payload.data?.overdueProjects ?? [];
        console.log(
          '🔶 [ProjectScreen] fetchWeeklyProjects: parsed payload',
          JSON.stringify(
            {
              weekProjectsCount: Array.isArray(weekProjects) ? weekProjects.length : 0,
              overdueProjectsCount: Array.isArray(overdueProjects) ? overdueProjects.length : 0,
            },
            null,
            2,
          ),
        );

        if (Array.isArray(weekProjects) || Array.isArray(overdueProjects)) {
          setWeeklyProjects([
            ...(Array.isArray(weekProjects) ? weekProjects : []),
            ...(Array.isArray(overdueProjects) ? overdueProjects : []),
          ]);
        } else {
          setWeeklyProjects([]);
        }
      } else {
        console.log('🔶 [ProjectScreen] fetchWeeklyProjects: empty response');
        setWeeklyProjects([]);
      }
    } catch (error) {
      console.error('🔴 [ProjectScreen] Error fetching weekly projects:', error);
      setWeeklyProjects([]);
    }
  };

  // Fetch projects (re-used on focus and retry)
  const fetchProjects = async () => {
    try {
      console.log('🔶 [ProjectScreen] fetchProjects: starting request');
      setPageLoading(true);
      setPageError(null);
      const startedAt = Date.now();
      const response = await callRealApi({
        method: 'GET',
        // Keep URL, but accept multiple possible response shapes
        url: '/projects?page=1&limit=10&search=&status=',
      });
      
      console.log('Full API Response:', JSON.stringify(response, null, 2));

      // Accept several possible response shapes gracefully
      let rawProjects: any[] = [];
      if (Array.isArray((response as any)?.data)) {
        console.log('🔶 [ProjectScreen] fetchProjects: using response.data array');
        rawProjects = (response as any).data;
      } else if (Array.isArray((response as any)?.projects)) {
        console.log('🔶 [ProjectScreen] fetchProjects: using response.projects array');
        rawProjects = (response as any).projects;
      } else if (Array.isArray(response as any)) {
        console.log('🔶 [ProjectScreen] fetchProjects: using response as array directly');
        rawProjects = response as any;
      } else {
        console.log(
          '⚠️ [ProjectScreen] fetchProjects: response shape not recognized, defaulting to empty list',
        );
      }

      console.log(
        '🔶 [ProjectScreen] fetchProjects: rawProjects length',
        Array.isArray(rawProjects) ? rawProjects.length : 'not-array',
      );

        const processedProjects = rawProjects.map((project: any) => ({
          ...project,
          teamMembers: extractTeamMembers(project),
        }));

        setProjects(processedProjects);

      // Derive stats locally from projects
      const derivedStats = processedProjects.reduce(
        (acc, p) => {
          const s = (p.status || '').toString();
          if (s === 'Completed') acc.Completed += 1;
          else if (s === 'In Progress') acc['In Progress'] += 1;
          else if (s === 'Not Started') acc['Not Started'] += 1;
          else if (s === 'On Hold') acc['On Hold'] += 1;
          else if (s === 'Cancelled') acc.Cancelled += 1;
          return acc;
        },
        { Completed: 0, 'In Progress': 0, 'Not Started': 0, 'On Hold': 0, Cancelled: 0 },
      );
      setStats(derivedStats);

      setPagination(prev => ({
            ...prev,
        total: processedProjects.length,
        totalPages: 1,
        page: 1,
          }));

      console.log(
        '🔶 [ProjectScreen] fetchProjects: processedProjects length',
        processedProjects.length,
      );

        const sortedByDate = [...processedProjects].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setRecentProjects(sortedByDate.slice(0, 5));
      console.log(
        '✅ [ProjectScreen] fetchProjects: success',
        JSON.stringify(
          {
            total: processedProjects.length,
            recentCount: Math.min(sortedByDate.length, 5),
            durationMs: Date.now() - startedAt,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error('🔴 [ProjectScreen] Error fetching projects from API:', error);
      // Fail gracefully: show empty list instead of infinite loading
      setPageError('Failed to load projects. Please check your connection and try again.');
      setProjects([]);
      setRecentProjects([]);
    } finally {
      console.log('🔶 [ProjectScreen] fetchProjects: setting pageLoading = false');
      setPageLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    console.log('🔁 [ProjectScreen] useEffect: initial mount, fetching projects');
    fetchProjects();
    fetchWeeklyProjects();
    // We intentionally leave the dependency array empty here to avoid
    // re-running on every render due to changing function identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch whenever this screen gains focus (e.g. after creating a project)
  useFocusEffect(
    useCallback(() => {
      console.log('🔁 [ProjectScreen] useFocusEffect: screen focused, refetching');
      fetchProjects();
      fetchWeeklyProjects();
      // We don't include fetch functions in deps to avoid infinite loops
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

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

  // Filter projects based on search query + simple status filter
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch =
    project.name.toLowerCase().includes(search.toLowerCase()) ||
          (project.task && project.task.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter
          ? (project.status || '').toString().toLowerCase() === statusFilter.toLowerCase()
          : true;

        return matchesSearch && matchesStatus;
      }),
    [projects, search, statusFilter],
  );

  // Function to handle project row click
  const handleProjectClick = (project: Project) => {
    navigation.navigate('ProjectDetail', { projectId: project._id });
  };

  // Use stats from API response (same as website)
  const inProgressCount = stats['In Progress'] || 0;
  const notStartedCount = stats['Not Started'] || 0;
  const completedCount = stats['Completed'] || 0;
  const onHoldCount = stats['On Hold'] || 0;
  const cancelledCount = stats['Cancelled'] || 0;
  // Check for Upcoming status (might not be in stats)
  const upcomingCount = stats['Upcoming'] || stats['upcoming'] || projects.filter(p => p.status === 'Upcoming' || p.status === 'upcoming').length;

  const totalProjects = pagination.total || projects.length;

  // Prepare donut chart data
  const donutSegments = [
    { label: 'Not Started', value: notStartedCount, color: '#6B7280' },
    { label: 'On Hold', value: onHoldCount, color: '#F59E0B' },
    { label: 'Cancelled', value: cancelledCount, color: '#EF4444' },
    { label: 'In Progress', value: inProgressCount, color: '#F59E0B' },
    { label: 'Completed', value: completedCount, color: '#10B981' },
    { label: 'Upcoming', value: upcomingCount, color: '#3B82F6' },
  ].filter(seg => seg.value > 0); // Only show segments with values > 0

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCarouselScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width * 0.7 + 12));
    setCarouselIndex(index);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const newIndex = direction === 'right' 
      ? Math.min(carouselIndex + 1, recentProjects.length - 1)
      : Math.max(carouselIndex - 1, 0);
    setCarouselIndex(newIndex);
    carouselRef.current?.scrollToIndex({ index: newIndex, animated: true });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Row 1: Projects Overview (Donut Chart) */}
        <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Projects Overview</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => (navigation as any).navigate('CreateProject')}
            >
              <Text style={styles.createButtonText}>+ Create</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            <DonutChart
              segments={donutSegments}
              size={180}
              stroke={20}
              centerTop="Total"
              centerBottom={`${totalProjects}`}
            />
          </View>
        </View>
      </View>

      {/* Row 2: Recent Projects (Carousel) */}
      <View style={styles.recentProjectsRow}>
        <View style={styles.recentProjectsCard}>
          <View style={styles.recentProjectsHeader}>
            <Text style={styles.recentProjectsTitle}>Recent Projects</Text>
            <View style={styles.carouselControls}>
              <TouchableOpacity
                style={[styles.carouselButton, carouselIndex === 0 && styles.carouselButtonDisabled]}
                onPress={() => scrollCarousel('left')}
                disabled={carouselIndex === 0}
              >
                <Ionicons name="chevron-back" size={20} color={carouselIndex === 0 ? '#ccc' : '#111827'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.carouselButton,
                  carouselIndex >= recentProjects.length - 1 && styles.carouselButtonDisabled,
                ]}
                onPress={() => scrollCarousel('right')}
                disabled={carouselIndex >= recentProjects.length - 1}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={carouselIndex >= recentProjects.length - 1 ? '#ccc' : '#111827'}
                />
              </TouchableOpacity>
            </View>
          </View>
          {recentProjects.length > 0 ? (
            <View>
              <FlatList
                ref={carouselRef}
                data={recentProjects}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleCarouselScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <ProjectCard project={item} onPress={handleProjectClick} />
                )}
                contentContainerStyle={styles.carouselContent}
                snapToInterval={width * 0.7 + 12}
                decelerationRate="fast"
                onMomentumScrollEnd={(event) => {
                  const contentOffsetX = event.nativeEvent.contentOffset.x;
                  const index = Math.round(contentOffsetX / (width * 0.7 + 12));
                  setCarouselIndex(index);
                }}
              />
            </View>
          ) : (
            <View style={styles.emptyCarousel}>
              <Text style={styles.emptyText}>No recent projects</Text>
            </View>
          )}
        </View>
      </View>

      {/* Row 3: Project List (Table) */}
      <View style={styles.projectListRow}>
        <View style={styles.projectListCard}>
          <View style={styles.projectListHeader}>
            <Text style={styles.projectListTitle}>Project List</Text>
            <View style={styles.projectListActions}>
              <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
                <MaterialIcons name="filter-list" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Ionicons name="download-outline" size={18} color="#f97316" />
                <Text style={styles.exportButtonText}>Export All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddProject}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

        {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIconLeft} />
          <TextInput
                placeholder="Search..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
                placeholderTextColor="#9CA3AF"
          />
            </View>
        </View>

          {/* Simple status filters */}
          {showFilters && (
            <View style={styles.statusFilterRow}>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  statusFilter === '' && styles.statusChipActive,
                ]}
                onPress={() => setStatusFilter('')}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    statusFilter === '' && styles.statusChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  statusFilter === 'In Progress' && styles.statusChipActive,
                ]}
                onPress={() => setStatusFilter('In Progress')}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    statusFilter === 'In Progress' && styles.statusChipTextActive,
                  ]}
                >
                  In Progress
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  statusFilter === 'Completed' && styles.statusChipActive,
                ]}
                onPress={() => setStatusFilter('Completed')}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    statusFilter === 'Completed' && styles.statusChipTextActive,
                  ]}
                >
                  Completed
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Table - Horizontally Scrollable */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.tableScrollContainer}
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={styles.tableContainer}>
              {/* Table Header */}
        <View style={styles.tableHeader}>
                <View style={[styles.checkboxColumn, { width: 40 }]}>
                  <TouchableOpacity
                    onPress={toggleAllProjects}
                    style={styles.checkboxHeader}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedProjects.size === filteredProjects.length && filteredProjects.length > 0 && styles.checkboxChecked
                    ]}>
                      {selectedProjects.size === filteredProjects.length && filteredProjects.length > 0 && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={[styles.projectNameColumn, { width: 160 }]}>
                  <Text style={styles.tableHead}>PROJECT NAME</Text>
                </View>
                <View style={[styles.dateColumn, { width: 110 }]}>
                  <Text style={styles.tableHead}>START DATE</Text>
                </View>
                <View style={[styles.dateColumn, { width: 110 }]}>
                  <Text style={styles.tableHead}>END DATE</Text>
                </View>
                <View style={[styles.statusColumn, { width: 100 }]}>
                  <Text style={styles.tableHead}>STATUS</Text>
                </View>
                <View style={[styles.priorityColumn, { width: 70 }]}>
                  <Text style={styles.tableHead}>PRIORITY</Text>
                </View>
        </View>

              {/* Table Rows */}
        {filteredProjects.length > 0 ? (
                filteredProjects.map((p, index) => (
              <View 
                key={p._id} 
                style={[
                  styles.tableRow,
                  index === filteredProjects.length - 1 && styles.tableRowLast
                ]}
              >
                    <View style={[styles.checkboxColumn, { width: 40 }]}>
                      <TouchableOpacity
                        onPress={() => toggleProjectSelection(p._id)}
                        style={styles.checkboxContainer}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedProjects.has(p._id) && styles.checkboxChecked
                        ]}>
                          {selectedProjects.has(p._id) && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.tableRowContent}
                      onPress={() => handleProjectClick(p)}
                      activeOpacity={0.7}
                    >
                    <View style={[styles.projectNameColumn, { width: 160 }]}>
                      <Text style={styles.tableCell} numberOfLines={1}>
                        {p.name}
                      </Text>
                    </View>
                    <View style={[styles.dateColumn, { width: 110 }]}>
                      <Text style={styles.tableCell}>
                        {formatDate(p.startDate)}
                      </Text>
                    </View>
                    <View style={[styles.dateColumn, { width: 110 }]}>
                      <Text style={styles.tableCell}>
                        {formatDate(p.endDate)}
                      </Text>
                    </View>
                    <View style={[styles.statusColumn, { width: 100 }]}>
                      <StatusBadge status={p.status} size="small" />
                </View>
                    <View style={[styles.priorityColumn, { width: 70 }]}>
                      <PriorityBadge priority={p.priority} variant="outlined" vertical={false} />
                    </View>
                    </TouchableOpacity>
              </View>
                ))
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
                    {search ? 'No projects found matching your search.' : 'No projects available.'}
            </Text>
          </View>
        )}
            </View>
          </ScrollView>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  // Row 1: Projects Overview
  overviewRow: {
    padding: 16,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Row 2: Recent Projects
  recentProjectsRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recentProjectsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentProjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentProjectsTitle: {
    fontSize: 18, 
    fontWeight: '700',
    color: '#111827',
  },
  carouselControls: {
    flexDirection: 'row',
    gap: 8,
  },
  carouselButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselButtonDisabled: {
    opacity: 0.5,
  },
  carouselContent: {
    paddingRight: 12,
  },
  emptyCarousel: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14, 
    color: '#9CA3AF',
  },
  // Row 3: Project List
  projectListRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  projectListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  projectListActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
    gap: 6,
  },
  exportButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  statusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  statusChipActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  statusChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  tableScrollContainer: {
    maxHeight: 500,
  },
  tableScrollContent: {
    paddingBottom: 8,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 590, // Reduced minimum width
  },
  tableHeader: { 
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  tableHead: { 
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  checkboxHeader: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectNameColumn: {
    paddingLeft: 4,
    paddingRight: 4,
    justifyContent: 'center',
  },
  dateColumn: {
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statusColumn: {
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityColumn: {
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tableRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default Dashboard;