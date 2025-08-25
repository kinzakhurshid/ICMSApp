import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';

// Define TypeScript interfaces
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ProjectFormData {
  name: string;
  priority: string;
  description: string;
  status: string;
  client: string;
  clientContact: string;
  clientEmail: string;
  projectManager: string;
  budget: string;
  amountSpent: string;
  startDate: string;
  endDate: string;
  teamMembers: string[];
  documents?: any[];
}

const ProjectCreationScreen = () => {
   const{callApi} =useAxios()
  // State for form fields
  const [projectName, setProjectName] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  const [projectDesc, setProjectDesc] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [client, setClient] = useState<string>('');
  const [clientContact, setClientContact] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [projectManager, setProjectManager] = useState<string>('');
  const [projectManagerId, setProjectManagerId] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>('');
  const [amountSpent, setAmountSpent] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [datePickerMode, setDatePickerMode] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentPickerResponse[]>([]);
  const [showProjectManagerModal, setShowProjectManagerModal] = useState<boolean>(false);
  const [showTeamMembersModal, setShowTeamMembersModal] = useState<boolean>(false);
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Priority options
  const priorityOptions: string[] = ['low', 'medium', 'high'];



  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await callApi({ method: 'GET', url: '/employee' });
      // console.log(response);
 
      setEmployees(response);
    } catch (error) {
      console.log('Error fetching employees:', error);
      Alert.alert('Error', 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees based on rodle
const projectManagers = employees.filter(
  emp => emp.role?.toLowerCase().trim() === 'pm'
);
console.log(projectManagers);
  const teamMembersList = employees;

  // Filter data based on search query
  const filteredProjectManagers = projectManagers.filter(pm => 
    `${pm.firstName} ${pm.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeamMembers = teamMembersList.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Unified date picker handler
  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    
    if (event.type !== 'dismissed' && selectedDate) {
      if (datePickerMode === 'start') {
        setStartDate(selectedDate);
      } else if (datePickerMode === 'end') {
        setEndDate(selectedDate);
      }
    }
    
    setDatePickerMode(null);
  };

  // Show date picker
  const showDatepicker = (mode: string) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  // Document upload handler
  const handleDocumentUpload = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      setDocuments([...documents, ...results]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled document picker');
      } else {
        console.log('DocumentPicker Error:', err);
        Alert.alert('Error', 'Failed to pick documents');
      }
    }
  };

  // Remove document handler
  const removeDocument = (index: number) => {
    const updatedDocs = [...documents];
    updatedDocs.splice(index, 1);
    setDocuments(updatedDocs);
  };

  // Select project manager handler
  const selectProjectManager = (manager: Employee) => {
    setProjectManager(`${manager.firstName} ${manager.lastName}`);
    setProjectManagerId(manager._id);
    setShowProjectManagerModal(false);
    setSearchQuery('');
  };

  // Toggle team member selection
  const toggleTeamMember = (member: Employee) => {
    if (teamMembers.some(m => m._id === member._id)) {
      setTeamMembers(teamMembers.filter(m => m._id !== member._id));
      setTeamMemberIds(teamMemberIds.filter(id => id !== member._id));
    } else {
      setTeamMembers([...teamMembers, member]);
      setTeamMemberIds([...teamMemberIds, member._id]);
    }
  };

  // Select priority handler
  const selectPriority = (priority: string) => {
    setPriority(priority);
    setShowPriorityModal(false);
  };

  // Form submission handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Required fields validation
      if (!projectName) {
        Alert.alert('Error', 'Project Name is required');
        return;
      }
      if (!projectDesc) {
        Alert.alert('Error', 'Project Description is required');
        return;
      }
      if (!client) {
        Alert.alert('Error', 'Client Name is required');
        return;
      }
      if (!projectManagerId) {
        Alert.alert('Error', 'Project Manager is required');
        return;
      }
      if (teamMemberIds.length === 0) {
        Alert.alert('Error', 'At least one Team Member is required');
        return;
      }
      if (!budget) {
        Alert.alert('Error', 'Budget is required');
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        Alert.alert('Error', 'End Date must be after Start Date');
        return;
      }

      // Prepare form data
      const formData = new FormData();
      
      // Append basic fields
      formData.append('name', projectName);
      formData.append('priority', priority);
      formData.append('description', projectDesc);
      formData.append('status', status || 'pending');
      formData.append('client', client);
      formData.append('clientContact', clientContact);
      formData.append('clientEmail', clientEmail);
      formData.append('projectManager', projectManagerId);
      formData.append('budget', budget);
      formData.append('amountSpent', amountSpent || '0');
      formData.append('startDate', startDate.toISOString());
      formData.append('endDate', endDate.toISOString());
      
      // Append team members
      teamMemberIds.forEach(id => {
        formData.append('teamMembers', id);
      });
      
      // Append documents
      documents.forEach((doc, index) => {
        formData.append('documents', {
          uri: doc.uri,
          type: doc.type,
          name: doc.name,
        } as any);
      });
      
      // Call API to create project
      await callApi({
        method: 'POST',
        url: '/projects/create',
        data: formData,
      });
      
      console.log('Form data to be submitted:', {
        name: projectName,
        priority,
        description: projectDesc,
        status: status || 'pending',
        client,
        clientContact,
        clientEmail,
        projectManager: projectManagerId,
        teamMembers: teamMemberIds,
        budget,
        amountSpent: amountSpent || '0',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        documents: documents.length,
      });
      
      Alert.alert('Success', 'Project created successfully!');
      // Reset form or navigate away
    } catch (error) {
      console.log('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render project manager modal
  const renderProjectManagerModal = () => (
    <Modal
      visible={showProjectManagerModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProjectManagerModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowProjectManagerModal(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Project Manager</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search project managers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Icon name="search" size={24} color="#ff7f00" />
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#ff7f00" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredProjectManagers}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => selectProjectManager(item)}
              >
                <Text>{`${item.firstName} ${item.lastName}`}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );

  // Render team members modal
  const renderTeamMembersModal = () => (
    <Modal
      visible={showTeamMembersModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTeamMembersModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowTeamMembersModal(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Team Members</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search team members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Icon name="search" size={24} color="#ff7f00" />
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#ff7f00" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredTeamMembers}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.modalItem, 
                  teamMembers.some(m => m._id === item._id) && styles.selectedItem
                ]}
                onPress={() => toggleTeamMember(item)}
              >
                <Text>{`${item.firstName} ${item.lastName}`} ({item.role})</Text>
                {teamMembers.some(m => m._id === item._id) && (
                  <Icon name="check" size={20} color="#ff7f00" />
                )}
              </TouchableOpacity>
            )}
          />
        )}
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => {
            setShowTeamMembersModal(false);
            setSearchQuery('');
          }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // Render priority modal
  const renderPriorityModal = () => (
    <Modal
      visible={showPriorityModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPriorityModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowPriorityModal(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Priority</Text>
        <FlatList
          data={priorityOptions}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.modalItem, 
                priority === item && styles.selectedItem
              ]}
              onPress={() => selectPriority(item)}
            >
              <Text style={styles.priorityText}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
              {priority === item && (
                <Icon name="check" size={20} color="#ff7f00" />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={['#ffffff', '#fff5e6']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Create New Project</Text>
        
        {/* Project Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Project Name *</Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Enter project name"
          />
        </View>

        {/* Priority Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Priority</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowPriorityModal(true)}
          >
            <Text style={styles.priorityText}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#ff7f00" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>

        {/* Project Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Project Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={projectDesc}
            onChangeText={setProjectDesc}
            placeholder="Enter project description"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Status */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Status</Text>
          <TextInput
            style={styles.input}
            value={status}
            onChangeText={setStatus}
            placeholder="Enter project status"
          />
        </View>

        {/* Client Information */}
        <Text style={styles.sectionHeader}>Client Information</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            value={client}
            onChangeText={setClient}
            placeholder="Enter client name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Client Contact</Text>
          <TextInput
            style={styles.input}
            value={clientContact}
            onChangeText={setClientContact}
            placeholder="Enter client contact number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Client Email</Text>
          <TextInput
            style={styles.input}
            value={clientEmail}
            onChangeText={setClientEmail}
            placeholder="Enter client email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Project Manager */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Project Manager *</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowProjectManagerModal(true)}
          >
            <Text style={!projectManager && styles.placeholderText}>
              {projectManager || 'Select project manager'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#ff7f00" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>

        {/* Team Members */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Team Members *</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowTeamMembersModal(true)}
          >
            <View style={styles.selectedMembersContainer}>
              {teamMembers.length === 0 ? (
                <Text style={styles.placeholderText}>Select team members</Text>
              ) : (
                <Text>{teamMembers.length} member(s) selected</Text>
              )}
            </View>
            <Icon name="arrow-drop-down" size={24} color="#ff7f00" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>

        {/* Budget Information */}
        <Text style={styles.sectionHeader}>Budget Information</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Budget *</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            placeholder="Enter project budget"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount Spent</Text>
          <TextInput
            style={styles.input}
            value={amountSpent}
            onChangeText={setAmountSpent}
            placeholder="Enter amount spent"
            keyboardType="numeric"
          />
        </View>

        {/* Dates */}
        <Text style={styles.sectionHeader}>Project Timeline</Text>
        
        <View style={styles.dateContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => showDatepicker('start')}
            >
              <Text>{startDate.toDateString()}</Text>
              <Icon name="event" size={20} color="#ff7f00" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => showDatepicker('end')}
            >
              <Text>{endDate.toDateString()}</Text>
              <Icon name="event" size={20} color="#ff7f00" />
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={datePickerMode === 'start' ? startDate : endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        {/* Document Upload */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Project Documents</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleDocumentUpload}>
            <Icon name="cloud-upload" size={24} color="#ff7f00" />
            <Text style={styles.uploadText}>Upload Documents</Text>
          </TouchableOpacity>
          
          {documents.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <Text style={styles.documentName} numberOfLines={1}>
                {doc.name}
              </Text>
              <TouchableOpacity onPress={() => removeDocument(index)}>
                <Icon name="close" size={20} color="#ff7f00" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <LinearGradient 
          colors={['#ff7f00', '#ff5500']} 
          style={styles.submitButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Create Project</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>

      {renderProjectManagerModal()}
      {renderTeamMembersModal()}
      {renderPriorityModal()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff7f00',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff7f00',
    marginTop: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff7f00',
    paddingLeft: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  inputIcon: {
    marginLeft: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityText: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  selectedMembersContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadText: {
    marginLeft: 10,
    color: '#ff7f00',
    fontWeight: '600',
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  documentName: {
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    borderRadius: 8,
    marginTop: 20,
    overflow: 'hidden',
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ff7f00',
    textAlign: 'center',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#fff5e6',
  },
  doneButton: {
    backgroundColor: '#ff7f00',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default ProjectCreationScreen;