import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import AppHeader from '../components/AppHeader';
import HiringCard from '../components/HiringCard';
import HiringTable from '../components/HiringTable';

const { width } = Dimensions.get('window');

interface Hiring {
  id: string;
  position: string;
  jobType: string;
  experience: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  applicantsCount: number;
  newToday: number;
}

interface OpenHiring {
  id: string;
  position: string;
  jobType: string;
  location: string;
  endDate: string;
  applicantsCount: number;
  newToday: number;
}

const HiringScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  
  const [loading, setLoading] = useState(true);
  const [hirings, setHirings] = useState<Hiring[]>([]);
  const [openHirings, setOpenHirings] = useState<OpenHiring[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableFilters, setAvailableFilters] = useState({
    locations: [] as string[],
    jobTypes: [] as string[],
    statuses: [] as string[],
  });
  const [filters, setFilters] = useState({
    status: '',
    jobType: '',
    location: '',
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    fetchHirings();
    fetchOpenHirings();
  }, []);

  useEffect(() => {
    fetchHirings();
  }, [page, searchTerm, filters]);

  const fetchHirings = async () => {
    try {
      const res = await callApi({
        method: 'GET',
        url: '/hirings',
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: filters.status,
          jobType: filters.jobType,
          location: filters.location,
        },
      });

      setHirings(res.data || []);
      setTotalPages(res.totalPages || 1);
      setAvailableFilters(res.filters || { locations: [], jobTypes: [], statuses: [] });
    } catch (error) {
      console.error('Error fetching hirings:', error);
      Alert.alert('Error', 'Failed to load hirings');
    }
  };

  const fetchOpenHirings = async () => {
    try {
      setLoading(true);
      const res = await callApi({ method: 'GET', url: '/hirings/open' });
      setOpenHirings(res || []);
    } catch (error) {
      console.error('Error fetching open hirings:', error);
      Alert.alert('Error', 'Failed to load open hirings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHiring = async (id: string) => {
    try {
      await callApi({ method: 'DELETE', url: `/hirings/${id}` });
      setHirings(hirings.filter(h => h.id !== id));
      setOpenHirings(openHirings.filter(h => h.id !== id));
      Alert.alert('Success', 'Job opening deleted');
    } catch (error) {
      console.error('Error deleting hiring:', error);
      Alert.alert('Error', 'Failed to delete job opening');
    }
  };

  const handleOpenDetails = (id: string) => {
    // Navigate to hiring details screen
    console.log('Opening details for hiring:', id);
  };

  const handleEdit = (id: string) => {
    // Navigate to edit screen
    console.log('Editing hiring:', id);
  };

  const scrollToNextCard = () => {
    if (currentCardIndex < openHirings.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const scrollToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Hiring Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation as any} />
      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Dashboard / Hiring</Text>
        </View>

        {/* Page Title with Arrow Buttons */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Hiring management</Text>
          <View style={styles.arrowButtonsContainer}>
            <TouchableOpacity
              style={[styles.arrowButton, currentCardIndex === 0 && styles.arrowButtonDisabled]}
              onPress={scrollToPrevCard}
              disabled={currentCardIndex === 0}
            >
              <Icon name="chevron-left" size={20} color={currentCardIndex === 0 ? '#ccc' : '#FF6B35'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.arrowButton, currentCardIndex === openHirings.length - 1 && styles.arrowButtonDisabled]}
              onPress={scrollToNextCard}
              disabled={currentCardIndex === openHirings.length - 1}
            >
              <Icon name="chevron-right" size={20} color={currentCardIndex === openHirings.length - 1 ? '#ccc' : '#FF6B35'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Open Hirings Carousel */}
        <View style={styles.carouselSection}>
          {openHirings.length > 0 ? (
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.8 + 16));
                  setCurrentCardIndex(index);
                }}
                style={styles.cardsScrollView}
              >
                {openHirings.map((hiring) => (
                  <HiringCard
                    key={hiring.id}
                    hiring={{
                      id: hiring.id,
                      position: hiring.position,
                      jobType: hiring.jobType,
                      location: hiring.location,
                      endDate: hiring.endDate,
                      applicantsCount: hiring.applicantsCount,
                      newToday: hiring.newToday,
                    }}
                    handleOpenDetails={handleOpenDetails}
                    onEdit={handleEdit}
                    onDelete={handleDeleteHiring}
                  />
                ))}
              </ScrollView>

            </View>
          ) : (
            <View style={styles.noHiringsContainer}>
              <Text style={styles.noHiringsText}>No open hirings currently</Text>
            </View>
          )}
        </View>

        {/* Hiring Table */}
        <HiringTable
          hirings={hirings}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          filters={filters}
          availableFilters={availableFilters}
          setFilters={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={handleEdit}
          onDelete={handleDeleteHiring}
          onView={handleOpenDetails}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  breadcrumb: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#666',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  arrowButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  arrowButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  carouselSection: {
    marginBottom: 24,
  },
  carouselContainer: {
    position: 'relative',
  },
  cardsScrollView: {
    paddingHorizontal: 8,
  },
  noHiringsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noHiringsText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HiringScreen;