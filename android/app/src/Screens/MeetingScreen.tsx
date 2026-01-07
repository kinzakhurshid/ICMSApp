import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import MeetingDetailModal from '../components/MeetingDetailModal';

const { width } = Dimensions.get('window');

interface Meeting {
  _id: string;
  title: string;
  name?: string; // Alternative title field
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  date?: string; // Alternative date field
  meetingUrl?: string;
  meetingLink?: string; // Alternative meeting URL field
  isCompleted?: boolean; // Boolean field for completion status
  isCancelled?: boolean; // Boolean field for cancellation status
  cancelled?: boolean; // Alternative boolean field for cancellation
  participants: Array<{
    _id: string;
    fullName: string;
    email: string;
  }>;
  createdBy: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MeetingStats {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  inProgress: number;
}

const MeetingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  
  // Use currentUser as displayUser
  const displayUser = currentUser;
  
  // Determine user role
  const isPM = (displayUser as any)?.role === 'PM' || (displayUser as any)?.role === 'pm';
  const isDeveloper = (displayUser as any)?.role === 'Developer' || (displayUser as any)?.role === 'developer';

  const fetchMeetingStats = async () => {
    try {
      // Use different endpoints based on user role
      const endpoint = isPM ? '/meetings/stats' : '/meetings/stats/me';
      const response = await callApi({
        method: 'GET',
        url: endpoint,
      });
      setStats(response.data || response);
    } catch (error) {
      console.error('Error fetching meeting stats:', error);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      // Use different endpoints based on user role
      const endpoint = isPM ? '/meetings/week' : '/meetings/week/me';
      const response = await callApi({
        method: 'GET',
        url: endpoint,
      });
      setUpcomingMeetings(response.data || response);
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error);
    }
  };

  const fetchAllMeetings = async () => {
    try {
      // Use different endpoints based on user role
      const endpoint = isPM ? '/meetings' : '/meetings/me';
      const response = await callApi({
        method: 'GET',
        url: endpoint,
        params: {
          page: 1,
          limit: 50,
        },
      });

      let meetingsData: any[] = [];

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
        console.log('🔍 Raw meeting data from API:', meetingsData);
        
        const meetingsWithStatus = meetingsData.map((m: any, index: number) => {
          // Log each meeting's raw data for debugging
          console.log(`🔍 Meeting ${index + 1} raw data:`, {
            title: m.title || m.name,
            status: m.status,
            isCompleted: m.isCompleted,
            isCancelled: m.isCancelled,
            cancelled: m.cancelled
          });
          
          // Prioritize boolean fields (isCompleted, isCancelled) over status field
          // This ensures that completed meetings always show as "Completed" not "Scheduled"
          let status = m.status;
          
          // Check boolean fields first - they take priority over status field
          if (m.isCompleted === true) {
            status = "Completed";
          } else if (m.isCancelled === true || m.cancelled === true) {
            status = "Cancelled";
          } else if (!status) {
            // Only default to "Scheduled" if no status is provided and meeting is not completed/cancelled
            status = "Scheduled";
          }
          
          console.log(`🔍 Meeting ${index + 1} final status:`, status);
          
          return {
            ...m,
            status: status,
          };
        });
        
        console.log('🔍 Final processed meetings:', meetingsWithStatus);
        setMeetings(meetingsWithStatus);
      } else {
        console.log('Invalid meeting data received from server');
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMeetingStats(),
        fetchUpcomingMeetings(),
        fetchAllMeetings(),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const markMeetingCompleted = async (meetingId: string) => {
    try {
      await callApi({
        method: 'PATCH',
        url: `/meetings/${meetingId}/complete`,
      });
      Alert.alert('Success', 'Meeting marked as completed');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark meeting as completed');
    }
  };

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

  const formatTime = (dateString: string): string => {
    try {
      if (!dateString) return "No time";
      
      // If it contains time information
      if (dateString.includes("T")) {
        const timePart = dateString.split("T")[1];
        if (timePart) {
          const [hours, minutes] = timePart.split(":");
          return `${hours}:${minutes}`;
        }
      }
      
      return dateString;
    } catch (error) {
      console.error("Error formatting time:", error);
      return dateString;
    }
  };

  const formatTableDate = (dateString: string): string => {
    try {
      if (!dateString) return "No date";
      
      // If it's already in a good format, return as is
      if (dateString.includes("T")) {
        const datePart = dateString.split("T")[0];
        return datePart;
      }
      
      return dateString;
    } catch (error) {
      console.error("Error formatting table date:", error);
      return dateString;
    }
  };

  const navigateCarousel = (direction: 'left' | 'right') => {
    const maxIndex = Math.max(0, upcomingMeetings.length - 1);
    if (direction === 'left') {
      setCarouselIndex(prev => prev > 0 ? prev - 1 : maxIndex);
    } else {
      setCarouselIndex(prev => prev < maxIndex ? prev + 1 : 0);
    }
  };

  const handleCreateMeeting = () => {
    try {
      // Navigate to CreateMeeting screen
      (navigation as any).navigate('CreateMeeting');
    } catch (error) {
      console.error('Error navigating to CreateMeeting:', error);
      Alert.alert(
        'Error',
        'Unable to open create meeting screen. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMeetingPress = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setDetailModalVisible(true);
  };

  const handleEditMeeting = (meetingId: string) => {
    setDetailModalVisible(false);
    (navigation as any).navigate('EditMeeting', { meetingId });
  };

  const handleRefreshMeetings = () => {
    loadData();
  };

  const joinMeeting = (meetingUrl?: string) => {
    if (meetingUrl) {
      Alert.alert(
        'Join Meeting',
        'Would you like to join this meeting?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join', onPress: () => {
            // Here you would typically open the meeting URL
            Alert.alert('Info', `Opening meeting: ${meetingUrl}`);
          }},
        ]
      );
    } else {
      Alert.alert('Error', 'No meeting URL available');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus (e.g., after creating a meeting)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  // Reload data when component mounts or user changes
  useEffect(() => {
    if (displayUser) {
      loadData();
    }
  }, [displayUser]);

  // Reload data when user role changes
  useEffect(() => {
    if (displayUser) {
      loadData();
    }
  }, [isPM, isDeveloper]);

  // Prepare pie chart data using actual meeting data
  const getPieChartData = () => {
    const statusCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
    
    meetings.forEach((m) => {
      // Use the normalized status that was set in meetingsWithStatus
      const status = (m.status || '').toString().trim();
      
      // Since we already normalized the status in meetingsWithStatus, we can directly check
      if (status === 'Completed') {
        statusCounts.Completed++;
      } else if (status === 'Cancelled') {
        statusCounts.Cancelled++;
      } else {
        // Everything else is Scheduled (including "Scheduled", "Upcoming", etc.)
        statusCounts.Scheduled++;
      }
    });
    
    console.log('🔍 Pie chart status counts:', statusCounts);
    console.log('🔍 Total meetings:', meetings.length);
    
    // Filter out zero-count categories to avoid pie chart rendering issues
    // But always show at least one category for consistent display
    const pieChartData = [];
    
    if (statusCounts.Scheduled > 0) {
      pieChartData.push({ 
        name: `Scheduled`, 
        population: statusCounts.Scheduled, 
        color: "#FF0004", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      });
    }
    
    if (statusCounts.Completed > 0) {
      pieChartData.push({ 
        name: `Completed`, 
        population: statusCounts.Completed, 
        color: "#D7AA00", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      });
    }
    
    if (statusCounts.Cancelled > 0) {
      pieChartData.push({ 
        name: `Cancelled`, 
        population: statusCounts.Cancelled, 
        color: "#FF5900", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      });
    }
    
    // If no meetings, show empty state data
    if (pieChartData.length === 0) {
      pieChartData.push({ 
        name: `No Meetings`, 
        population: 1, 
        color: "#CCCCCC", 
        legendFontColor: "#333", 
        legendFontSize: 12 
      });
    }
    
    return pieChartData;
  };

  const pieChartData = getPieChartData();

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading meetings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meeting Management</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateMeeting}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
        </View>


      {/* Pie Chart and Upcoming Meetings */}
      <View style={styles.chartCarouselContainer}>
        {/* Pie Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Meeting Status Distribution</Text>
          {pieChartData.length > 0 && pieChartData[0].population > 0 ? (
            <View style={styles.pieChartWrapper}>
              <PieChart
                data={pieChartData}
                width={width - 80}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute
                hasLegend={true}
              />
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No meeting data available</Text>
            </View>
          )}
        </View>

        {/* Upcoming Meetings Carousel */}
        <View style={styles.carouselContainer}>
          <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
          {upcomingMeetings.length > 0 ? (
            <>
              <View style={styles.carouselWrapper}>
                {/* Left Arrow */}
                <TouchableOpacity
                  style={styles.carouselArrow}
                  onPress={() => navigateCarousel('left')}
                  disabled={upcomingMeetings.length <= 1}
                >
                  <Ionicons name="chevron-back" size={20} color={upcomingMeetings.length <= 1 ? "#CCCCCC" : "#FFFFFF"} />
                </TouchableOpacity>

                {/* Meeting Card */}
                <View style={styles.carouselContent}>
                  <TouchableOpacity
                    style={styles.meetingCard}
                    onPress={() => handleMeetingPress(upcomingMeetings[carouselIndex]._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.meetingCardHeader}>
                      <Text style={styles.meetingTitle} numberOfLines={2}>
                        {upcomingMeetings[carouselIndex].name || upcomingMeetings[carouselIndex].title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                        <Text style={styles.statusText}>Upcoming</Text>
                      </View>
                    </View>
                    <View style={styles.meetingInfoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" style={styles.meetingInfoIcon} />
                      <Text style={styles.meetingDate}>
                        {formatDate(upcomingMeetings[carouselIndex].date || upcomingMeetings[carouselIndex].startDate)}
                      </Text>
                    </View>
                    <View style={styles.meetingInfoRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" style={styles.meetingInfoIcon} />
                      <Text style={styles.meetingTime}>
                        {formatTime(upcomingMeetings[carouselIndex].date || upcomingMeetings[carouselIndex].startDate)}
                      </Text>
                    </View>
                    <View style={styles.meetingTypeContainer}>
                      <Text style={styles.meetingType}>{upcomingMeetings[carouselIndex].type}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => joinMeeting(upcomingMeetings[carouselIndex].meetingUrl || upcomingMeetings[carouselIndex].meetingLink)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="videocam" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>

                {/* Right Arrow */}
                <TouchableOpacity
                  style={styles.carouselArrow}
                  onPress={() => navigateCarousel('right')}
                  disabled={upcomingMeetings.length <= 1}
                >
                  <Ionicons name="chevron-forward" size={20} color={upcomingMeetings.length <= 1 ? "#CCCCCC" : "#FFFFFF"} />
                </TouchableOpacity>
              </View>
              
              {/* Upcoming Meetings List */}
              {upcomingMeetings.length > 1 && (
                <View style={styles.upcomingListContainer}>
                  <Text style={styles.upcomingListTitle}>All Upcoming ({upcomingMeetings.length})</Text>
                  <ScrollView style={styles.upcomingList} showsVerticalScrollIndicator={true}>
                    {upcomingMeetings.map((meeting, index) => (
                      <TouchableOpacity
                        key={meeting._id}
                        style={[styles.upcomingListItem, index === carouselIndex && styles.upcomingListItemActive]}
                        onPress={() => {
                          setCarouselIndex(index);
                          handleMeetingPress(meeting._id);
                        }}
                      >
                        <View style={styles.upcomingListItemContent}>
                          <Text style={styles.upcomingListItemTitle} numberOfLines={1}>
                            {meeting.name || meeting.title}
                          </Text>
                          <Text style={styles.upcomingListItemDate}>
                            {formatDate(meeting.date || meeting.startDate)} • {formatTime(meeting.date || meeting.startDate)}
                          </Text>
                          <Text style={styles.upcomingListItemType}>{meeting.type}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noMeetingsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noMeetingsText}>No upcoming meetings</Text>
              <Text style={styles.noMeetingsSubtext}>Check back later for new meetings</Text>
            </View>
          )}
        </View>
        </View>

      {/* Meeting Details Table */}
        <View style={styles.tableContainer}>
        <Text style={styles.sectionTitle}>All Meetings</Text>
        <ScrollView style={styles.table} horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContent}>
          {/* Table Header */}
              <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.titleHeader]}>Title</Text>
            <Text style={[styles.headerCell, styles.typeHeader]}>Type</Text>
            <Text style={[styles.headerCell, styles.statusHeader]}>Status</Text>
            <Text style={[styles.headerCell, styles.dateHeader]}>Date</Text>
            <Text style={[styles.headerCell, styles.timeHeader]}>Time</Text>
            <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
          </View>

          {/* Table Rows */}
          {meetings.length > 0 ? (
            meetings.map((meeting, index) => (
              <TouchableOpacity
                key={meeting._id}
                style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                onPress={() => handleMeetingPress(meeting._id)}
              >
                <Text style={[styles.cell, styles.titleCell]} numberOfLines={2}>
                  {meeting.name || meeting.title}
                </Text>
                <Text style={[styles.cell, styles.typeCell]}>{meeting.type}</Text>
                <View style={styles.statusCell}>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: meeting.status === 'Completed' ? '#10B981' :
                                      meeting.status === 'Cancelled' ? '#EF4444' :
                                      meeting.status === 'In Progress' ? '#3B82F6' : '#F59E0B'
                    }
                  ]}>
                    <Text style={styles.statusText}>{meeting.status}</Text>
                  </View>
                </View>
                <Text style={[styles.cell, styles.dateCell]}>
                  {formatTableDate(meeting.date || meeting.startDate)}
                </Text>
                <Text style={[styles.cell, styles.timeCell]}>
                  {formatTime(meeting.date || meeting.startDate)}
                </Text>
                <View style={styles.actionsCell}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => joinMeeting(meeting.meetingUrl || meeting.meetingLink)}
                  >
                    <Ionicons name="videocam" size={16} color="#f97316" />
                  </TouchableOpacity>
                  {meeting.status === 'Upcoming' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => markMeetingCompleted(meeting._id)}
                    >
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                    </TouchableOpacity>
                  )}
                    </View>
              </TouchableOpacity>
                  ))
                ) : (
            <View style={styles.noDataRow}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noDataText}>No meetings found</Text>
              <Text style={styles.noDataSubtext}>Create your first meeting to get started</Text>
            </View>
          )}
          </View>
        </ScrollView>
      </View>

      {/* Meeting Detail Modal */}
      <MeetingDetailModal
        visible={detailModalVisible}
        meetingId={selectedMeetingId}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedMeetingId(null);
        }}
        onEdit={handleEditMeeting}
        onRefresh={handleRefreshMeetings}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  chartCarouselContainer: {
    padding: 16,
    gap: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'visible',
    paddingVertical: 10,
  },
  carouselContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  carouselWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 12,
    minHeight: 180,
  },
  carouselContent: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0, // Allow flex to work properly
  },
  carouselArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  meetingCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  meetingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },
  meetingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingInfoIcon: {
    marginRight: 6,
  },
  meetingDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  meetingTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  meetingTypeContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  meetingType: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noMeetingsContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMeetingsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
  },
  noMeetingsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  upcomingListContainer: {
    marginTop: 16,
    maxHeight: 300,
  },
  upcomingListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  upcomingList: {
    maxHeight: 250,
  },
  upcomingListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  upcomingListItemActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#f97316',
    borderWidth: 2,
  },
  upcomingListItemContent: {
    flex: 1,
  },
  upcomingListItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  upcomingListItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  upcomingListItemType: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
    marginTop: 4,
  },
  tableContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  tableContent: {
    minWidth: 620, // Total width of all columns (160+90+100+100+80+90)
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleHeader: { width: 160 },
  typeHeader: { width: 90 },
  statusHeader: { width: 100 },
  dateHeader: { width: 100 },
  timeHeader: { width: 80 },
  actionsHeader: { width: 90 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    minHeight: 60,
  },
  evenRow: {
    backgroundColor: '#FEFEFE',
  },
  cell: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  titleCell: { width: 160, fontWeight: '600', color: '#1E293B' },
  typeCell: { width: 90, color: '#64748B', fontSize: 13 },
  statusCell: { width: 100 },
  dateCell: { width: 100, color: '#64748B', fontSize: 13 },
  timeCell: { width: 80, color: '#64748B', fontSize: 13 },
  actionsCell: { width: 90, flexDirection: 'row', gap: 6, justifyContent: 'center' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noDataRow: {
    padding: 32,
    alignItems: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MeetingScreen;