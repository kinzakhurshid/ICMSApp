import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import DocumentPicker from 'react-native-document-picker';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import AppHeader from '../components/AppHeader';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time' | null>(null);
  const [activeTab, setActiveTab] = useState('Personal');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [maritalStatus, setMaritalStatus] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [nationality, setNationality] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [taxId, setTaxId] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [hireDate, setHireDate] = useState<string>('');       // stored as ISO date string yyyy-mm-dd
  const [probationDate, setProbationDate] = useState<string>(''); // stored as ISO date string
  
  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // Bank Account
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  
  // Education
  const [degree, setDegree] = useState('');
  const [institute, setInstitute] = useState('');
  
  // Files
  const [profileImage, setProfileImage] = useState<any>(null);
  const [idCardFile, setIdCardFile] = useState<any>(null);
  const [degreeFile, setDegreeFile] = useState<any>(null);
  const [certificateFile, setCertificateFile] = useState<any>(null);
  const [experienceDocFile, setExperienceDocFile] = useState<any>(null);

  useEffect(() => {
    fetchEmployeeData();
    fetchDepartments();
  }, [currentUser?.employee?._id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      if (!currentUser?.employee?._id) {
        Alert.alert('Error', 'Employee ID not found');
        navigation.goBack();
        return;
      }
      const response = await callApi({
        method: 'GET',
        url: `/employee/${currentUser.employee._id}`,
      });
      setEmployee(response);
      
      // Populate form fields
      setFirstName(response?.firstName || '');
      setLastName(response?.lastName || '');
      setEmail(response?.email || '');
      setContactNumber(response?.contactNumber || '');
      setGender(response?.gender || '');
      setDateOfBirth(response?.dateOfBirth ? new Date(response.dateOfBirth) : new Date());
      setMaritalStatus(response?.maritalStatus || '');
      setCity(response?.city || '');
      setState(response?.state || '');
      setNationality(response?.nationality || '');
      setPosition(response?.position || '');
      setDepartment(typeof response?.department === 'object' ? response.department.name : '');
      setDepartmentId(typeof response?.department === 'object' ? response.department._id : response?.department || '');
      setSalary(response?.salary?.toString() || '');
      setStatus(response?.status || '');
      setRole(response?.role || '');
      setTaxId(response?.taxId || '');
      setSkills(response?.skills || []);
      setEmergencyName(response?.emergencyContact?.name || '');
      setEmergencyRelation(response?.emergencyContact?.relation || '');
      setEmergencyPhone(response?.emergencyContact?.phone || '');
      setBankName(response?.bankAccount?.bankName || '');
      setAccountNumber(response?.bankAccount?.accountNumber || '');
      setBranch(response?.bankAccount?.branch || '');
      setDegree(response?.education?.degree || '');
      setInstitute(response?.education?.institute || '');
      setHireDate(response?.hireDate || '');
      setProbationDate(response?.probationDate || '');
    } catch (error) {
      console.error('Error fetching employee data:', error);
      Alert.alert('Error', 'Failed to load profile data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await callApi({
        method: 'GET',
        url: '/departments/', // Plural with trailing slash - matches EditEmployeeScreen
      });
      // Handle different response structures
      let departmentsData = [];
      if (Array.isArray(response)) {
        departmentsData = response;
      } else if (response && Array.isArray(response.data)) {
        departmentsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        departmentsData = response.data.data;
      } else {
        departmentsData = [];
      }
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Silently fail - departments are optional and don't block profile editing
      setDepartments([]);
    }
  };

  const handlePickImage = async (type: 'profile' | 'idCard' | 'degree' | 'certificate' | 'experienceDoc') => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        width: 800,
        height: 800,
        cropping: type === 'profile',
        quality: 0.8,
      });

      const fileData = {
        uri: image.path,
        type: image.mime || 'image/jpeg',
        name: image.filename || `image_${Date.now()}.jpg`,
      };

      switch (type) {
        case 'profile':
          setProfileImage(fileData);
          break;
        case 'idCard':
          setIdCardFile(fileData);
          break;
        case 'degree':
          setDegreeFile(fileData);
          break;
        case 'certificate':
          setCertificateFile(fileData);
          break;
        case 'experienceDoc':
          setExperienceDocFile(fileData);
          break;
      }
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to pick image');
      }
    }
  };

  const handlePickDocument = async (type: 'idCard' | 'degree' | 'certificate' | 'experienceDoc') => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });

      if (results && results.length > 0) {
        const file = results[0];
        const fileData = {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'document.pdf',
        };

        switch (type) {
          case 'idCard':
            setIdCardFile(fileData);
            break;
          case 'degree':
            setDegreeFile(fileData);
            break;
          case 'certificate':
            setCertificateFile(fileData);
            break;
          case 'experienceDoc':
            setExperienceDocFile(fileData);
            break;
        }
      }
    } catch (error: any) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (!currentUser?.employee?._id) {
        Alert.alert('Error', 'Employee ID not found');
        return;
      }

      // Create FormData
      const formData = new FormData();

      // Basic fields
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('email', email.trim());
      formData.append('contactNumber', contactNumber.trim());
      formData.append('gender', gender);
      formData.append('dateOfBirth', dateOfBirth.toISOString());
      formData.append('maritalStatus', maritalStatus);
      formData.append('city', city.trim());
      formData.append('state', state.trim());
      formData.append('nationality', nationality.trim());
      formData.append('position', position.trim());
      if (departmentId) formData.append('department', departmentId);
      if (salary) formData.append('salary', salary);
      if (status) formData.append('status', status);
      if (role) formData.append('role', role);
      if (taxId) formData.append('taxId', taxId.trim());

      // Nested objects as JSON strings
      const emergencyContact = {
        name: emergencyName.trim(),
        relation: emergencyRelation.trim(),
        phone: emergencyPhone.trim(),
      };
      formData.append('emergencyContact', JSON.stringify(emergencyContact));

      const bankAccount = {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        branch: branch.trim(),
      };
      formData.append('bankAccount', JSON.stringify(bankAccount));

      const education = {
        degree: degree.trim(),
        institute: institute.trim(),
      };
      formData.append('education', JSON.stringify(education));

      if (skills.length > 0) {
        formData.append('skills', JSON.stringify(skills));
      }

      // Dates required by backend (keep existing values if user cannot edit)
      if (hireDate) {
        formData.append('hireDate', hireDate);
      }
      if (probationDate) {
        formData.append('probationDate', probationDate);
      }

      // Organization (required) – same resolution logic as EditEmployeeScreen
      const organizationId =
        (currentUser as any)?.organization ||
        (currentUser as any)?.organizationId ||
        (currentUser as any)?.employee?.organizationId ||
        (currentUser as any)?.employee?.organization;

      if (organizationId) {
        formData.append('organization', organizationId);
      } else {
        console.warn('EditProfileScreen: organizationId missing; backend may reject request');
      }

      // Files
      if (profileImage) {
        formData.append('imageFile', {
          uri: profileImage.uri,
          type: profileImage.type,
          name: profileImage.name,
        } as any);
      }
      if (idCardFile) {
        formData.append('idCard', {
          uri: idCardFile.uri,
          type: idCardFile.type,
          name: idCardFile.name,
        } as any);
      }
      if (degreeFile) {
        formData.append('degree', {
          uri: degreeFile.uri,
          type: degreeFile.type,
          name: degreeFile.name,
        } as any);
      }
      if (certificateFile) {
        formData.append('certificate', {
          uri: certificateFile.uri,
          type: certificateFile.type,
          name: certificateFile.name,
        } as any);
      }
      if (experienceDocFile) {
        formData.append('experienceDoc', {
          uri: experienceDocFile.uri,
          type: experienceDocFile.type,
          name: experienceDocFile.name,
        } as any);
      }

      // API call
      await callApi({
        method: 'PUT',
        url: `/employee/updateOne/${currentUser.employee._id}`,
        data: formData,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Always return to EmployeeProfile screen after successful update
            (navigation as any).navigate('EmployeeProfile');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'Personal', label: 'Personal', icon: 'user' },
    { key: 'Work', label: 'Work Details', icon: 'briefcase' },
    { key: 'Education', label: 'Education', icon: 'graduation-cap' },
    { key: 'Financial', label: 'Financial', icon: 'credit-card' },
    { key: 'Documents', label: 'Documents', icon: 'file' },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        navigation={navigation} 
        title="Edit Profile" 
        showBackButton={true}
        onBackPress={() => (navigation as any).navigate('EmployeeProfile')}
      />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon name={tab.icon} size={16} color={activeTab === tab.key ? '#f97316' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Personal Tab */}
        {activeTab === 'Personal' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Contact Number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.radioGroup}>
                  {['male', 'female', 'other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.radioOption}
                      onPress={() => setGender(g)}
                    >
                      <View style={[styles.radio, gender === g && styles.radioSelected]}>
                        {gender === g && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioLabel}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    setDatePickerMode('date');
                    setShowDatePicker(true);
                  }}
                >
                  <Text>{dateOfBirth.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marital Status</Text>
              <View style={styles.radioGroup}>
                {['single', 'married', 'divorced', 'widowed'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.radioOption}
                    onPress={() => setMaritalStatus(m)}
                  >
                    <View style={[styles.radio, maritalStatus === m && styles.radioSelected]}>
                      {maritalStatus === m && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nationality</Text>
              <TextInput
                style={styles.input}
                value={nationality}
                onChangeText={setNationality}
                placeholder="Nationality"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Emergency Contact</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={emergencyName}
                onChangeText={setEmergencyName}
                placeholder="Emergency Contact Name"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Relation</Text>
                <TextInput
                  style={styles.input}
                  value={emergencyRelation}
                  onChangeText={setEmergencyRelation}
                  placeholder="Relation"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        )}

        {/* Work Tab */}
        {activeTab === 'Work' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Work Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="Position"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDepartmentModal(true)}
              >
                <Text style={!department ? styles.placeholder : {}}>
                  {department || 'Select Department'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <TextInput
                style={styles.input}
                value={role}
                onChangeText={setRole}
                placeholder="Role"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <TextInput
                style={styles.input}
                value={status}
                onChangeText={setStatus}
                placeholder="Status (e.g., FullTime, PartTime)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary</Text>
              <TextInput
                style={styles.input}
                value={salary}
                onChangeText={setSalary}
                placeholder="Salary"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skills</Text>
              <View style={styles.skillContainer}>
                {skills.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <Icon name="times" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.skillInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={skillInput}
                  onChangeText={setSkillInput}
                  placeholder="Add a skill"
                  onSubmitEditing={addSkill}
                />
                <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                  <Icon name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Education Tab */}
        {activeTab === 'Education' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Education Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Degree</Text>
              <TextInput
                style={styles.input}
                value={degree}
                onChangeText={setDegree}
                placeholder="Degree (e.g., BS, MS)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institute</Text>
              <TextInput
                style={styles.input}
                value={institute}
                onChangeText={setInstitute}
                placeholder="Institute Name"
              />
            </View>
          </View>
        )}

        {/* Financial Tab */}
        {activeTab === 'Financial' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Financial Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tax ID</Text>
              <TextInput
                style={styles.input}
                value={taxId}
                onChangeText={setTaxId}
                placeholder="Tax ID"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Bank Account Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Bank Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Account Number"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch</Text>
              <TextInput
                style={styles.input}
                value={branch}
                onChangeText={setBranch}
                placeholder="Branch"
              />
            </View>
          </View>
        )}

        {/* Documents Tab */}
        {activeTab === 'Documents' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Upload Documents</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Image</Text>
              <View style={styles.fileUploadContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage.uri }} style={styles.previewImage} />
                ) : employee?.profileImage ? (
                  <Image source={{ uri: employee.profileImage }} style={styles.previewImage} />
                ) : null}
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => handlePickImage('profile')}
                >
                  <Icon name="camera" size={16} color="#f97316" />
                  <Text style={styles.fileButtonText}>Change Profile Image</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID Card</Text>
              <View style={styles.fileUploadContainer}>
                {idCardFile ? (
                  <Text style={styles.fileName}>{idCardFile.name}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => handlePickDocument('idCard')}
                >
                  <Icon name="file" size={16} color="#f97316" />
                  <Text style={styles.fileButtonText}>Upload ID Card</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Degree Document</Text>
              <View style={styles.fileUploadContainer}>
                {degreeFile ? (
                  <Text style={styles.fileName}>{degreeFile.name}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => handlePickDocument('degree')}
                >
                  <Icon name="file" size={16} color="#f97316" />
                  <Text style={styles.fileButtonText}>Upload Degree</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Certificate</Text>
              <View style={styles.fileUploadContainer}>
                {certificateFile ? (
                  <Text style={styles.fileName}>{certificateFile.name}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => handlePickDocument('certificate')}
                >
                  <Icon name="file" size={16} color="#f97316" />
                  <Text style={styles.fileButtonText}>Upload Certificate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience Document</Text>
              <View style={styles.fileUploadContainer}>
                {experienceDocFile ? (
                  <Text style={styles.fileName}>{experienceDocFile.name}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => handlePickDocument('experienceDoc')}
                >
                  <Icon name="file" size={16} color="#f97316" />
                  <Text style={styles.fileButtonText}>Upload Experience Doc</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="save" size={16} color="#fff" />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Department Modal */}
      <Modal
        visible={showDepartmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepartmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setShowDepartmentModal(false)}>
                <Icon name="times" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={departments}
              keyExtractor={(item) => item._id || item.id || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setDepartment(item.name || item);
                    setDepartmentId(item._id || item.id || item);
                    setShowDepartmentModal(false);
                  }}
                >
                  <Text>{item.name || item}</Text>
                  {departmentId === (item._id || item.id || item) && (
                    <Icon name="check" size={16} color="#f97316" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode={datePickerMode || 'date'}
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDateOfBirth(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#f97316',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#f97316',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f97316',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  skillTag: {
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  skillInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#f97316',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileUploadContainer: {
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  fileButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  fileName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});

