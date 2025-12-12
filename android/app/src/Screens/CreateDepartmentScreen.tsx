import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import useAxios from '../hooks/useAxios';

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  employee?: {
    fullName?: string;
    lastName?: string;
  };
}

const CreateDepartmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [admin, setAdmin] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: '/user',
      });
      setUsers(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
      });

      setProfilePicture({
        uri: image.path,
        name: image.filename || `profile_${Date.now()}.jpg`,
        type: image.mime || 'image/jpeg',
      });
    } catch (error: any) {
      if (error.message !== 'User cancelled image picker') {
        Alert.alert('Error', 'Failed to pick image');
      }
    }
  };

  const getAdminName = (user: User) => {
    if (user.name) return user.name;
    if (user.employee?.fullName) return user.employee.fullName;
    return user.email || 'Unknown';
  };

  const getAdminDisplay = () => {
    if (!admin) return 'No admin selected';
    const selectedUser = users.find(u => u._id === admin);
    if (!selectedUser) return 'No admin selected';
    const name = getAdminName(selectedUser);
    const role = selectedUser.role ? ` (${selectedUser.role})` : '';
    return `${name}${role}`;
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const name = getAdminName(user).toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Department name is required');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      if (admin) {
        formData.append('admin', admin);
      }

      if (profilePicture) {
        formData.append('imageFile', {
          uri: profilePicture.uri,
          type: profilePicture.type,
          name: profilePicture.name,
        } as any);
      }

      const response = await callApi({
        method: 'POST',
        url: '/departments',
        data: formData,
      });

      if (response?.success !== false) {
        Alert.alert('Success', 'Department created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response?.message || 'Failed to create department');
      }
    } catch (error: any) {
      console.error('Error creating department:', error);
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Department</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formCard}>
        {/* Department Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Department Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter department name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter description"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Admin */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Admin</Text>
          <TouchableOpacity
            style={styles.adminInput}
            onPress={() => setShowAdminModal(true)}
          >
            <Text style={[styles.adminText, !admin && styles.adminPlaceholder]}>
              {getAdminDisplay()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Profile Picture */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity style={styles.fileInput} onPress={handlePickImage}>
            <Text style={styles.fileInputText}>
              {profilePicture ? profilePicture.name : 'Choose File no file selected'}
            </Text>
          </TouchableOpacity>
          {profilePicture && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: profilePicture.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setProfilePicture(null)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Department</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Admin Selection Modal */}
      {showAdminModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Admin</Text>
              <TouchableOpacity onPress={() => {
                setShowAdminModal(false);
                setSearchQuery('');
              }}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search users..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setAdmin('');
                  setShowAdminModal(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.modalItemText}>No Admin</Text>
              </TouchableOpacity>
              {filteredUsers.map(user => (
                <TouchableOpacity
                  key={user._id}
                  style={[styles.modalItem, admin === user._id && styles.modalItemSelected]}
                  onPress={() => {
                    setAdmin(user._id);
                    setShowAdminModal(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.modalItemText}>{getAdminName(user)}</Text>
                  {user.role && <Text style={styles.modalItemRole}>{user.role}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  adminInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  adminText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  adminPlaceholder: {
    color: '#9CA3AF',
  },
  fileInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  fileInputText: {
    fontSize: 14,
    color: '#111827',
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#FB923C',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  modalItemText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  modalItemRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default CreateDepartmentScreen;



