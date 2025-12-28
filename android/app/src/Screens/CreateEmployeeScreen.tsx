import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import FormSection from '../components/task/FormSection';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';
import NumberInputField from '../components/task/NumberInputField';
import LabelInputField from '../components/task/LabelInputField';
import ExperienceItem, { Experience } from '../components/employee/ExperienceItem';
import DocumentUploadCard from '../components/employee/DocumentUploadCard';

interface Department {
  _id: string;
  name: string;
}

const roleOptions = [
  { label: 'HR', value: 'HR' },
  { label: 'PM', value: 'PM' },
  { label: 'Developer', value: 'Developer' },
  { label: 'QA', value: 'QA' },
  { label: 'Admin', value: 'Admin' },
  { label: 'OrgAdmin', value: 'OrgAdmin' },
];

const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

const maritalStatusOptions = [
  { label: 'Single', value: 'Single' },
  { label: 'Married', value: 'Married' },
  { label: 'Divorced', value: 'Divorced' },
  { label: 'Widowed', value: 'Widowed' },
];

const jobTypeOptions = [
  { label: 'Full-time', value: 'Full-time' },
  { label: 'Part-time', value: 'Part-time' },
  { label: 'Contract', value: 'Contract' },
  { label: 'Internship', value: 'Internship' },
];

export default function CreateEmployeeScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Profile Image
  const [profileImage, setProfileImage] = useState<{ uri: string; name: string; type: string } | null>(null);

  // Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Job Details
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [jobType, setJobType] = useState('');
  const [hireDate, setHireDate] = useState<Date | null>(null);
  const [probationDate, setProbationDate] = useState<Date | null>(null);
  const [salary, setSalary] = useState(0);

  // Personal Information
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Bank & Tax Details
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [taxId, setTaxId] = useState('');

  // Education
  const [degree, setDegree] = useState('');
  const [institute, setInstitute] = useState('');

  // Skills
  const [skills, setSkills] = useState<string[]>([]);

  // Experience
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Documents
  const [idCard, setIdCard] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [degreeDoc, setDegreeDoc] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [certificate, setCertificate] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [experienceDoc, setExperienceDoc] = useState<{ uri: string; name: string; type: string } | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await callApi({
        method: 'GET',
        url: '/departments/',
      });
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading departments:', error);
      Alert.alert('Error', 'Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handlePickProfileImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
      });

      setProfileImage({
        uri: image.path,
        name: image.filename || 'profile.jpg',
        type: image.mime || 'image/jpeg',
      });
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to pick image');
      }
    }
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        position: '',
        company: '',
        jobType: '',
        startDate: null,
        endDate: null,
        isCurrent: false,
        description: '',
      },
    ]);
  };

  const updateExperience = (index: number, experience: Experience) => {
    const updated = [...experiences];
    updated[index] = experience;
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic Information
    if (!firstName.trim() || firstName.length > 20) newErrors.firstName = 'First name is required (max 20 chars)';
    if (!lastName.trim() || lastName.length > 20) newErrors.lastName = 'Last name is required (max 20 chars)';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Valid email is required';
    if (!phoneNumber.trim() || !/^\d+$/.test(phoneNumber)) newErrors.phoneNumber = 'Valid phone number is required';
    if (!password || password.length < 6) newErrors.password = 'Password is required (min 6 characters)';

    // Job Details
    if (!role) newErrors.role = 'Role is required';
    if (!department) newErrors.department = 'Department is required';
    if (!position.trim()) newErrors.position = 'Position is required';
    if (!jobType) newErrors.jobType = 'Job type is required';
    if (!hireDate) newErrors.hireDate = 'Hire date is required';
    if (hireDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hireDateOnly = new Date(hireDate);
      hireDateOnly.setHours(0, 0, 0, 0);
      if (hireDateOnly > today) {
        newErrors.hireDate = 'Hire date cannot be in the future';
      }
    }
    if (!probationDate) newErrors.probationDate = 'Probation date is required';
    if (hireDate && probationDate && probationDate < hireDate) {
      newErrors.probationDate = 'Probation date must be after hire date';
    }
    if (salary < 0) newErrors.salary = 'Salary must be 0 or greater';

    // Personal Information
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (dateOfBirth) {
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const dayDiff = today.getDate() - dateOfBirth.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      if (actualAge < 18) {
        newErrors.dateOfBirth = 'Employee must be at least 18 years old';
      }
      if (actualAge > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }
    if (!gender) newErrors.gender = 'Gender is required';
    // Marital status is optional
    if (!nationality.trim()) newErrors.nationality = 'Nationality is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    
    // City-State coordination (basic validation)
    const cityStateMap: Record<string, string> = {
      'Karachi': 'Sindh',
      'Lahore': 'Punjab',
      'Islamabad': 'Islamabad Capital Territory',
      'Rawalpindi': 'Punjab',
      'Faisalabad': 'Punjab',
      'Multan': 'Punjab',
      'Peshawar': 'Khyber Pakhtunkhwa',
      'Quetta': 'Balochistan',
    };
    if (city.trim() && state.trim() && cityStateMap[city.trim()]) {
      const expectedState = cityStateMap[city.trim()];
      if (state.trim() !== expectedState && !state.trim().toLowerCase().includes(expectedState.toLowerCase().split(' ')[0])) {
        newErrors.city = `City "${city}" typically belongs to "${expectedState}"`;
      }
    }

    // Emergency Contact
    if (!emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!emergencyRelation.trim()) newErrors.emergencyRelation = 'Emergency contact relation is required';
    if (!emergencyPhone.trim() || !/^\d+$/.test(emergencyPhone)) newErrors.emergencyPhone = 'Valid emergency phone is required';
    
    // Bank & Tax Details - optional (not required)

    // Education
    if (!degree.trim()) newErrors.degree = 'Degree is required';
    if (!institute.trim()) newErrors.institute = 'Institute is required';

    // Experience validation
    experiences.forEach((exp, index) => {
      if (!exp.position.trim()) newErrors[`experience_${index}_position`] = 'Position is required';
      if (!exp.company.trim()) newErrors[`experience_${index}_company`] = 'Company is required';
      if (!exp.jobType) newErrors[`experience_${index}_jobType`] = 'Job type is required';
      if (!exp.startDate) newErrors[`experience_${index}_startDate`] = 'Start date is required';
      if (!exp.isCurrent && !exp.endDate) {
        newErrors[`experience_${index}_endDate`] = 'End date is required';
      }
      if (exp.startDate && exp.endDate && !exp.isCurrent) {
        if (exp.endDate < exp.startDate) {
          newErrors[`experience_${index}_endDate`] = 'End date must be after start date';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) {
      // Show specific error messages for better user feedback
      const errorMessages = Object.values(errors).filter(msg => msg);
      if (errorMessages.length > 0) {
        // Highlight password error specifically
        if (errors.password) {
          Alert.alert('Validation Error', `Password is required (minimum 6 characters).\n\nPlease fill all required fields correctly.`);
        } else {
          Alert.alert('Validation Error', `Please fix the following errors:\n\n${errorMessages.slice(0, 3).join('\n')}${errorMessages.length > 3 ? '\n...' : ''}`);
        }
      } else {
        Alert.alert('Validation Error', 'Please fill all required fields correctly');
      }
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      // Basic Information
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('email', email.trim());
      formData.append('contactNumber', phoneNumber.trim());
      formData.append('password', password);
      if (profileImage) {
        formData.append('profileImage', {
          uri: profileImage.uri,
          type: profileImage.type,
          name: profileImage.name,
        } as any);
      }

      // Job Details
      formData.append('role', role);
      formData.append('department', department);
      formData.append('position', position.trim());
      // Map jobType to status format expected by server
      // Server might expect: FullTime, PartTime, Contract, Internship, Hybrid, etc.
      const statusValue = jobType === 'Full-time' ? 'FullTime' : 
                         jobType === 'Part-time' ? 'PartTime' : 
                         jobType; // Contract, Internship, etc. as-is
      formData.append('status', statusValue);
      formData.append('hireDate', hireDate!.toISOString().split('T')[0]);
      formData.append('probationDate', probationDate!.toISOString().split('T')[0]);
      formData.append('salary', salary.toString());
      formData.append('isActive', 'true');

      // Personal Information
      formData.append('dateOfBirth', dateOfBirth!.toISOString().split('T')[0]);
      // Normalize gender and maritalStatus to lowercase to match server expectations
      formData.append('gender', gender.toLowerCase());
      formData.append('maritalStatus', maritalStatus.toLowerCase());
      formData.append('nationality', nationality.trim());
      formData.append('city', city.trim());
      formData.append('state', state.trim());

      // Emergency Contact (JSON stringified)
      const emergencyContactData = {
        name: emergencyName.trim(),
        relation: emergencyRelation.trim(),
        phone: emergencyPhone.trim(),
      };
      formData.append('emergencyContact', JSON.stringify(emergencyContactData));

      // Education (JSON stringified)
      const educationData = {
        degree: degree.trim(),
        institute: institute.trim(),
      };
      formData.append('education', JSON.stringify(educationData));

      // Bank & Tax Details (JSON stringified) - always send, even if empty
      const bankAccountData: any = {};
      if (accountNumber.trim()) bankAccountData.accountNumber = accountNumber.trim();
      if (bankName.trim()) bankAccountData.bankName = bankName.trim();
      if (branch.trim()) bankAccountData.branch = branch.trim();
      formData.append('bankAccount', JSON.stringify(bankAccountData));
      
      // Tax ID - send empty string if not provided (to match website format)
      formData.append('taxId', taxId.trim() || '');

      // Skills (JSON stringified) - always send, even if empty array
      formData.append('skills', JSON.stringify(skills.length > 0 ? skills : []));

      // Experience (JSON stringified) - always send, even if empty array
      const experiencesData = experiences.map(exp => {
        // Normalize jobType to match status format (FullTime, PartTime, etc.)
        const normalizedJobType = 
          exp.jobType === 'Full-time' ? 'FullTime' :
          exp.jobType === 'Part-time' ? 'PartTime' :
          exp.jobType || 'FullTime';
        
        const expData: any = {
          position: (exp.position || '').trim(),
          company: (exp.company || '').trim(),
          jobType: normalizedJobType,
          startDate: exp.startDate ? exp.startDate.toISOString().split('T')[0] : '',
          isCurrent: Boolean(exp.isCurrent), // Ensure it's a boolean
          description: (exp.description || '').trim(), // Always include description
        };
        // Only add endDate if not current and endDate exists
        if (!exp.isCurrent && exp.endDate) {
          expData.endDate = exp.endDate.toISOString().split('T')[0];
        }
        return expData;
      });
      formData.append('experiences', JSON.stringify(experiencesData));

      // Documents
      if (idCard) {
        formData.append('idCard', {
          uri: idCard.uri,
          type: idCard.type,
          name: idCard.name,
        } as any);
      }
      if (degreeDoc) {
        formData.append('degreeDoc', {
          uri: degreeDoc.uri,
          type: degreeDoc.type,
          name: degreeDoc.name,
        } as any);
      }
      if (certificate) {
        formData.append('certificate', {
          uri: certificate.uri,
          type: certificate.type,
          name: certificate.name,
        } as any);
      }
      if (experienceDoc) {
        formData.append('experienceDoc', {
          uri: experienceDoc.uri,
          type: experienceDoc.type,
          name: experienceDoc.name,
        } as any);
      }

      // System field - ensure organization is not empty
      // Check multiple possible locations for organization ID
      const organizationId = 
        currentUser?.organization || 
        (currentUser as any)?.organizationId ||
        (currentUser as any)?.employee?.organizationId ||
        (currentUser as any)?.employee?.organization;
      
      console.log('Current user:', currentUser);
      console.log('Organization ID found:', organizationId);
      
      if (!organizationId) {
        console.error('Organization ID missing. Current user object:', JSON.stringify(currentUser, null, 2));
        Alert.alert('Error', 'Organization ID is missing. Please log in again.');
        setSubmitting(false);
        return;
      }
      formData.append('organization', organizationId);

      // Log the form data for debugging (without files)
      console.log('Submitting employee data:', {
        firstName,
        lastName,
        email,
        role,
        department,
        position,
        organization: organizationId,
        hireDate: hireDate!.toISOString().split('T')[0],
        probationDate: probationDate!.toISOString().split('T')[0],
        dateOfBirth: dateOfBirth!.toISOString().split('T')[0],
        salary: salary.toString(),
        contactNumber: phoneNumber.trim(),
        emergencyContact: JSON.stringify(emergencyContactData),
        education: JSON.stringify(educationData),
        bankAccount: JSON.stringify(bankAccountData),
        skills: JSON.stringify(skills.length > 0 ? skills : []),
        experiences: JSON.stringify(experiencesData),
        isActive: 'true',
        status: jobType,
        gender,
        maritalStatus,
        nationality: nationality.trim(),
        city: city.trim(),
        state: state.trim(),
        taxId: taxId.trim() || '',
        hasPassword: !!password,
        hasProfileImage: !!profileImage,
        hasIdCard: !!idCard,
        hasDegreeDoc: !!degreeDoc,
        hasCertificate: !!certificate,
        hasExperienceDoc: !!experienceDoc,
      });

      await callApi({
        method: 'POST',
        url: '/employee/create',
        data: formData,
        headers: {
          // Don't set Content-Type manually - let axios set it automatically with boundary
        },
      });

      Alert.alert('Success', 'Employee created successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).navigate('HREmployees'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating employee:', error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.error || 'Failed to create employee';
      console.error('Full error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const departmentOptions = departments.map((dept) => ({
    label: dept.name,
    value: dept._id,
  }));

  if (loadingDepartments) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading departments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).navigate('HREmployees')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Employee</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage.uri }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={48} color="#9ca3af" />
              )}
              <TouchableOpacity style={styles.addImageButton} onPress={handlePickProfileImage}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Information */}
          <FormSection title="Basic Information">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="First Name"
                  required
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  placeholder="Enter first name"
                  error={errors.firstName}
                  maxLength={20}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Last Name"
                  required
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  placeholder="Enter last name"
                  error={errors.lastName}
                  maxLength={20}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Phone Number"
                  required
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                  }}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Email"
                  required
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
              </View>
            </View>

            <FormField
              label="Password"
              required
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="Enter password (min 6 characters)"
              secureTextEntry
              error={errors.password}
            />
          </FormSection>

          {/* Job Details */}
          <FormSection title="Job Details">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DropdownField
                  label="Role"
                  required
                  value={role}
                  options={roleOptions}
                  onSelect={(value) => {
                    setRole(value);
                    if (errors.role) setErrors({ ...errors, role: '' });
                  }}
                  placeholder="Select an option"
                  error={errors.role}
                />
              </View>
              <View style={styles.column}>
                <DropdownField
                  label="Department"
                  required
                  value={department}
                  options={departmentOptions}
                  onSelect={(value) => {
                    setDepartment(value);
                    if (errors.department) setErrors({ ...errors, department: '' });
                  }}
                  placeholder="Select an option"
                  error={errors.department}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Job Position"
                  required
                  value={position}
                  onChangeText={(text) => {
                    setPosition(text);
                    if (errors.position) setErrors({ ...errors, position: '' });
                  }}
                  placeholder="Enter Position"
                  error={errors.position}
                />
              </View>
              <View style={styles.column}>
                <DropdownField
                  label="Job Type"
                  required
                  value={jobType}
                  options={jobTypeOptions}
                  onSelect={(value) => {
                    setJobType(value);
                    if (errors.jobType) setErrors({ ...errors, jobType: '' });
                  }}
                  placeholder="Select an option"
                  error={errors.jobType}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DatePickerField
                  label="Hire Date"
                  required
                  value={hireDate}
                  onChange={(date) => {
                    setHireDate(date);
                    if (errors.hireDate) setErrors({ ...errors, hireDate: '' });
                  }}
                  maximumDate={new Date()}
                  error={errors.hireDate}
                />
              </View>
              <View style={styles.column}>
                <DatePickerField
                  label="Probation Date"
                  required
                  value={probationDate}
                  onChange={(date) => {
                    setProbationDate(date);
                    if (errors.probationDate) setErrors({ ...errors, probationDate: '' });
                  }}
                  minimumDate={hireDate || undefined}
                  error={errors.probationDate}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DatePickerField
                  label="Date of Birth"
                  required
                  value={dateOfBirth}
                  onChange={(date) => {
                    setDateOfBirth(date);
                    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
                  }}
                  maximumDate={new Date()}
                  error={errors.dateOfBirth}
                />
              </View>
              <View style={styles.column}>
                <NumberInputField
                  label="Salary"
                  required
                  value={salary}
                  onChange={setSalary}
                  min={0}
                  error={errors.salary}
                />
              </View>
            </View>
          </FormSection>

          {/* Personal Information */}
          <FormSection title="Personal Information">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DropdownField
                  label="Gender"
                  required
                  value={gender}
                  options={genderOptions}
                  onSelect={(value) => {
                    setGender(value);
                    if (errors.gender) setErrors({ ...errors, gender: '' });
                  }}
                  placeholder="Select an option"
                  error={errors.gender}
                />
              </View>
              <View style={styles.column}>
                <DropdownField
                  label="Marital Status"
                  value={maritalStatus}
                  options={maritalStatusOptions}
                  onSelect={(value) => {
                    setMaritalStatus(value);
                    if (errors.maritalStatus) setErrors({ ...errors, maritalStatus: '' });
                  }}
                  placeholder="Select an option (optional)"
                  error={errors.maritalStatus}
                />
              </View>
            </View>

            <FormField
              label="Nationality"
              required
              value={nationality}
              onChangeText={(text) => {
                setNationality(text);
                if (errors.nationality) setErrors({ ...errors, nationality: '' });
              }}
              placeholder="Enter nationality"
              error={errors.nationality}
            />

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="City"
                  required
                  value={city}
                  onChangeText={(text) => {
                    setCity(text);
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                  placeholder="Enter city"
                  error={errors.city}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="State"
                  required
                  value={state}
                  onChangeText={(text) => {
                    setState(text);
                    if (errors.state) setErrors({ ...errors, state: '' });
                  }}
                  placeholder="Enter state"
                  error={errors.state}
                />
              </View>
            </View>
          </FormSection>

          {/* Emergency Contact */}
          <FormSection title="Emergency Contacts">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Name"
                  required
                  value={emergencyName}
                  onChangeText={(text) => {
                    setEmergencyName(text);
                    if (errors.emergencyName) setErrors({ ...errors, emergencyName: '' });
                  }}
                  placeholder="Emergency Contact Name"
                  error={errors.emergencyName}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Relation"
                  required
                  value={emergencyRelation}
                  onChangeText={(text) => {
                    setEmergencyRelation(text);
                    if (errors.emergencyRelation) setErrors({ ...errors, emergencyRelation: '' });
                  }}
                  placeholder="Relation"
                  error={errors.emergencyRelation}
                />
              </View>
            </View>

            <FormField
              label="Phone Number"
              required
              value={emergencyPhone}
              onChangeText={(text) => {
                setEmergencyPhone(text);
                if (errors.emergencyPhone) setErrors({ ...errors, emergencyPhone: '' });
              }}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              error={errors.emergencyPhone}
            />
          </FormSection>

          {/* Bank & Tax Details */}
          <FormSection title="Bank and Tax Details">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Account Number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Account Number (optional)"
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Bank Name"
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="Bank Name (optional)"
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Branch"
                  value={branch}
                  onChangeText={setBranch}
                  placeholder="Branch (optional)"
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Tax ID"
                  value={taxId}
                  onChangeText={setTaxId}
                  placeholder="Enter tax ID (optional)"
                />
              </View>
            </View>
          </FormSection>

          {/* Education */}
          <FormSection title="Education">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Degree Program"
                  required
                  value={degree}
                  onChangeText={(text) => {
                    setDegree(text);
                    if (errors.degree) setErrors({ ...errors, degree: '' });
                  }}
                  placeholder="Enter degree program"
                  error={errors.degree}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Institute"
                  required
                  value={institute}
                  onChangeText={(text) => {
                    setInstitute(text);
                    if (errors.institute) setErrors({ ...errors, institute: '' });
                  }}
                  placeholder="Enter institute"
                  error={errors.institute}
                />
              </View>
            </View>
          </FormSection>

          {/* Skills */}
          <FormSection title="Skills">
            <LabelInputField
              label=""
              values={skills}
              onChange={setSkills}
            />
          </FormSection>

          {/* Experience */}
          <FormSection title="Experience">
            {experiences.map((exp, index) => (
              <ExperienceItem
                key={index}
                experience={exp}
                index={index}
                onChange={(updatedExp) => updateExperience(index, updatedExp)}
                onRemove={() => removeExperience(index)}
                jobTypeOptions={jobTypeOptions}
              />
            ))}
            <TouchableOpacity style={styles.addExperienceButton} onPress={addExperience}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addExperienceButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </FormSection>

          {/* Documents */}
          <FormSection title="Employee Documents (optional)">
            <View style={styles.documentsGrid}>
              <View style={styles.documentColumn}>
                <DocumentUploadCard
                  title="ID Card Document"
                  value={idCard}
                  onChange={setIdCard}
                />
              </View>
              <View style={styles.documentColumn}>
                <DocumentUploadCard
                  title="Degree Document"
                  value={degreeDoc}
                  onChange={setDegreeDoc}
                />
              </View>
              <View style={styles.documentColumn}>
                <DocumentUploadCard
                  title="Certificate Document"
                  value={certificate}
                  onChange={setCertificate}
                />
              </View>
              <View style={styles.documentColumn}>
                <DocumentUploadCard
                  title="Experience Document"
                  value={experienceDoc}
                  onChange={setExperienceDoc}
                />
              </View>
            </View>
          </FormSection>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Employee</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  addImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  addExperienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  addExperienceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  documentColumn: {
    width: '48%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});


