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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';

interface FormData {
  position: string;
  jobType: string;
  officeTiming: string;
  location: string;
  workMode: 'Onsite' | 'Remote' | 'Hybrid';
  startDate: Date | null;
  endDate: Date | null;
  status: 'Open' | 'Closed';
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  salaryRange: string;
  experienceLevel: string;
  education: string;
  numberOfPositions: string;
}

const EditHiringScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { callApi } = useAxios();
  const { hiringId } = route.params as { hiringId: string };

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    position: '',
    jobType: '',
    officeTiming: '',
    location: '',
    workMode: 'Onsite',
    startDate: null,
    endDate: null,
    status: 'Open',
    description: '',
    responsibilities: [],
    requirements: [],
    skills: [],
    salaryRange: '',
    experienceLevel: '',
    education: '',
    numberOfPositions: '1',
  });

  const [newResponsibility, setNewResponsibility] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingResp, setGeneratingResp] = useState(false);
  const [generatingReq, setGeneratingReq] = useState(false);

  const jobTypeOptions = [
    { label: 'Full-time', value: 'Full-time' },
    { label: 'Part-time', value: 'Part-time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Internship', value: 'Internship' },
    { label: 'Remote', value: 'Remote' },
    { label: 'Freelance', value: 'Freelance' },
  ];

  const experienceLevelOptions = [
    { label: 'Entry Level', value: 'Entry Level' },
    { label: 'Junior', value: 'Junior' },
    { label: 'Mid Level', value: 'Mid Level' },
    { label: 'Senior', value: 'Senior' },
    { label: 'Lead', value: 'Lead' },
    { label: 'Executive', value: 'Executive' },
  ];

  const educationLevelOptions = [
    { label: 'High School', value: 'High School' },
    { label: 'Associate Degree', value: 'Associate Degree' },
    { label: 'Bachelor\'s Degree', value: 'Bachelor\'s Degree' },
    { label: 'Master\'s Degree', value: 'Master\'s Degree' },
    { label: 'PhD', value: 'PhD' },
    { label: 'No Formal Education Required', value: 'No Formal Education Required' },
  ];

  const workModeOptions = [
    { label: 'Onsite', value: 'Onsite' },
    { label: 'Remote', value: 'Remote' },
    { label: 'Hybrid', value: 'Hybrid' },
  ];

  const statusOptions = [
    { label: 'Open', value: 'Open' },
    { label: 'Closed', value: 'Closed' },
  ];

  useEffect(() => {
    fetchHiringDetails();
  }, [hiringId]);

  const fetchHiringDetails = async () => {
    try {
      setLoading(true);
      const res = await callApi({
        method: 'GET',
        url: `/hirings/${hiringId}`,
      });
      const hiring = res.data || res;

      // Populate form with existing data
      setFormData({
        position: hiring.position || '',
        jobType: hiring.jobType || '',
        officeTiming: hiring.officeTiming || '',
        location: hiring.location || '',
        workMode: hiring.workMode || 'Onsite',
        startDate: hiring.startDate ? new Date(hiring.startDate) : null,
        endDate: hiring.endDate ? new Date(hiring.endDate) : null,
        status: hiring.status || 'Open',
        description: hiring.description || '',
        responsibilities: hiring.responsibilities || [],
        requirements: hiring.requirements || [],
        skills: hiring.skills || [],
        salaryRange: hiring.salaryRange || '',
        experienceLevel: hiring.experienceLevel || '',
        education: hiring.education || '',
        numberOfPositions: String(hiring.numberOfPositions || 1),
      });
    } catch (error) {
      console.error('Error fetching hiring details:', error);
      Alert.alert('Error', 'Failed to load job details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.position.trim()) return 'Position is required';
    if (!formData.jobType) return 'Job type is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.experienceLevel) return 'Experience level is required';
    if (!formData.education) return 'Education is required';
    if (!formData.salaryRange.trim()) return 'Salary range is required';
    if (!formData.officeTiming.trim()) return 'Office timing is required';
    if (!formData.startDate) return 'Start date is required';
    if (!formData.endDate) return 'End date is required';
    if (!formData.description.trim()) return 'Description is required';
    if (formData.responsibilities.length === 0) return 'At least one responsibility is required';
    if (formData.requirements.length === 0) return 'At least one requirement is required';
    if (formData.position.length > 100) return 'Position must be 100 characters or less';
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      return 'End date must be after start date';
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      setSubmitting(true);

      const numberOfPositions = Number(formData.numberOfPositions) || 1;

      const payload = {
        position: formData.position.trim(),
        jobType: formData.jobType,
        officeTiming: formData.officeTiming.trim(),
        location: formData.location.trim(),
        workMode: formData.workMode,
        startDate: formData.startDate ? formData.startDate.toISOString() : undefined,
        endDate: formData.endDate ? formData.endDate.toISOString() : undefined,
        status: formData.status,
        description: formData.description.trim(),
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        salaryRange: formData.salaryRange.trim(),
        experienceLevel: formData.experienceLevel,
        education: formData.education,
        numberOfPositions,
      };

      await callApi({
        method: 'PUT',
        url: `/hirings/${hiringId}`,
        data: payload,
      });

      Alert.alert('Success', 'Job opening updated successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating job:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update job opening');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, newResponsibility.trim()],
      }));
      setNewResponsibility('');
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }));
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const cleanLines = (text: string) =>
    text
      .split(/\r?\n/)
      .map(line =>
        line
          .replace(/^[\-\*\u2022\d\.\)\s]+/, '')
          .replace(/\*\*/g, '')
          .trim(),
      )
      .filter(line => line.length > 0);

  const handleGenerateDescriptionAI = async () => {
    if (!formData.position.trim()) {
      Alert.alert('Validation', 'Please enter a position first.');
      return;
    }
    try {
      setGeneratingDesc(true);
      const prompt = `
Generate a professional 150-200 word job description for a ${formData.position} role.
Experience level: ${formData.experienceLevel || 'not specified'}.
Education: ${formData.education || 'not specified'}.
Focus only on the description of the role, expectations, and work environment.
Do NOT include headings like "Responsibilities" or "Requirements".
      `.trim();

      const res = await callApi({
        method: 'POST',
        url: '/generate-content',
        data: { prompt },
      });

      const raw = res?.result || '';
      const cleaned = cleanLines(raw).join(' ');

      if (!cleaned) {
        Alert.alert('AI Error', 'AI did not return a valid description.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        description: cleaned,
      }));
    } catch (error) {
      console.error('Error generating description:', error);
      Alert.alert('Error', 'Failed to generate description with AI');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleGenerateResponsibilitiesAI = async () => {
    if (!formData.position.trim()) {
      Alert.alert('Validation', 'Please enter a position first.');
      return;
    }
    try {
      setGeneratingResp(true);
      const prompt = `
List 5-7 key responsibilities for a ${formData.position} role.
Job type: ${formData.jobType || 'not specified'}.
Format as plain lines without markdown or numbering.
      `.trim();

      const res = await callApi({
        method: 'POST',
        url: '/generate-content',
        data: { prompt },
      });

      const raw = res?.result || '';
      const items = cleanLines(raw);
      if (items.length === 0) {
        Alert.alert('AI Error', 'AI did not return valid responsibilities.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, ...items],
      }));
    } catch (error) {
      console.error('Error generating responsibilities:', error);
      Alert.alert('Error', 'Failed to generate responsibilities with AI');
    } finally {
      setGeneratingResp(false);
    }
  };

  const handleGenerateRequirementsAI = async () => {
    if (!formData.position.trim()) {
      Alert.alert('Validation', 'Please enter a position first.');
      return;
    }
    try {
      setGeneratingReq(true);
      const prompt = `
List 5-7 key requirements for a ${formData.position} role.
Experience level: ${formData.experienceLevel || 'not specified'}.
Education: ${formData.education || 'not specified'}.
Format as plain lines without markdown or numbering.
      `.trim();

      const res = await callApi({
        method: 'POST',
        url: '/generate-content',
        data: { prompt },
      });

      const raw = res?.result || '';
      const items = cleanLines(raw);
      if (items.length === 0) {
        Alert.alert('AI Error', 'AI did not return valid requirements.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, ...items],
      }));
    } catch (error) {
      console.error('Error generating requirements:', error);
      Alert.alert('Error', 'Failed to generate requirements with AI');
    } finally {
      setGeneratingReq(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
          <Icon name="arrow-back-ios" size={18} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Edit Job Opening</Text>
          <Text style={styles.headerSubtitle}>
            Update the details below to modify the job posting
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Position */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Position Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior Frontend Developer"
            placeholderTextColor="#9CA3AF"
            value={formData.position}
            onChangeText={(text) => updateField('position', text)}
          />
          <Text style={styles.helpText}>{formData.position.length}/100 characters</Text>
        </View>

        {/* Row: Job Type, Location */}
        <View style={styles.row}>
          <View style={styles.col}>
            <DropdownField
              label="Job Type"
              required
              value={formData.jobType}
              options={jobTypeOptions}
              onSelect={(value) => updateField('jobType', value)}
              placeholder="Select job type"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Islamabad"
              placeholderTextColor="#9CA3AF"
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <DropdownField
              label="Work Mode"
              required
              value={formData.workMode}
              options={workModeOptions}
              onSelect={(value) => updateField('workMode', value as 'Onsite' | 'Remote' | 'Hybrid')}
              placeholder="Select work mode"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Number of Positions *</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              value={formData.numberOfPositions}
              keyboardType="number-pad"
              onChangeText={(text) => updateField('numberOfPositions', text)}
            />
          </View>
        </View>

        {/* Row: Experience, Education */}
        <View style={styles.row}>
          <View style={styles.col}>
            <DropdownField
              label="Experience Level"
              required
              value={formData.experienceLevel}
              options={experienceLevelOptions}
              onSelect={(value) => updateField('experienceLevel', value)}
              placeholder="Select experience level"
            />
          </View>
          <View style={styles.col}>
            <DropdownField
              label="Education Level"
              required
              value={formData.education}
              options={educationLevelOptions}
              onSelect={(value) => updateField('education', value)}
              placeholder="Select education level"
            />
          </View>
        </View>

        {/* Row: Salary, Status */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Salary Range *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PKR 80,000 - 100,000"
              placeholderTextColor="#9CA3AF"
              value={formData.salaryRange}
              onChangeText={(text) => updateField('salaryRange', text)}
            />
          </View>
          <View style={styles.col}>
            <DropdownField
              label="Status"
              required
              value={formData.status}
              options={statusOptions}
              onSelect={(value) => updateField('status', value as 'Open' | 'Closed')}
              placeholder="Select status"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Office Timing *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9:00 AM - 5:00 PM"
            placeholderTextColor="#9CA3AF"
            value={formData.officeTiming}
            onChangeText={(text) => updateField('officeTiming', text)}
          />
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={styles.col}>
            <DatePickerField
              label="Start Date"
              required
              value={formData.startDate}
              onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
              minimumDate={new Date()}
            />
          </View>
          <View style={styles.col}>
            <DatePickerField
              label="End Date"
              required
              value={formData.endDate}
              onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
              minimumDate={formData.startDate || new Date()}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description *</Text>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={handleGenerateDescriptionAI}
              disabled={generatingDesc}
            >
              <Text style={styles.smallButtonText}>
                {generatingDesc ? 'Generating...' : 'Generate with AI'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide a detailed description of the job..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
          />
        </View>

        {/* Responsibilities */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Responsibilities *</Text>
            <TouchableOpacity
              style={[styles.smallButton, { marginLeft: 8 }]}
              onPress={handleGenerateResponsibilitiesAI}
              disabled={generatingResp}
            >
              <Text style={styles.smallButtonText}>
                {generatingResp ? 'Generating...' : 'Generate with AI'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.listInput]}
              placeholder="Enter a responsibility..."
              placeholderTextColor="#9CA3AF"
              value={newResponsibility}
              onChangeText={setNewResponsibility}
              onSubmitEditing={handleAddResponsibility}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddResponsibility}>
              <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {formData.responsibilities.map((item, idx) => (
            <View key={idx} style={styles.listItemRow}>
              <Text style={styles.listItem}>• {item}</Text>
              <TouchableOpacity onPress={() => handleRemoveResponsibility(idx)}>
                <Icon name="close" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Requirements *</Text>
            <TouchableOpacity
              style={[styles.smallButton, { marginLeft: 8 }]}
              onPress={handleGenerateRequirementsAI}
              disabled={generatingReq}
            >
              <Text style={styles.smallButtonText}>
                {generatingReq ? 'Generating...' : 'Generate with AI'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.listInput]}
              placeholder="Enter a requirement..."
              placeholderTextColor="#9CA3AF"
              value={newRequirement}
              onChangeText={setNewRequirement}
              onSubmitEditing={handleAddRequirement}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddRequirement}>
              <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {formData.requirements.map((item, idx) => (
            <View key={idx} style={styles.listItemRow}>
              <Text style={styles.listItem}>• {item}</Text>
              <TouchableOpacity onPress={() => handleRemoveRequirement(idx)}>
                <Icon name="close" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Skills Required */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Skills Required</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.listInput]}
              placeholder="Enter a skill..."
              placeholderTextColor="#9CA3AF"
              value={newSkill}
              onChangeText={setNewSkill}
              onSubmitEditing={handleAddSkill}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
              <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {formData.skills.map((item, idx) => (
            <View key={idx} style={styles.listItemRow}>
              <Text style={styles.listItem}>• {item}</Text>
              <TouchableOpacity onPress={() => handleRemoveSkill(idx)}>
                <Icon name="close" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Updating...' : 'Update Job'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    marginRight: 8,
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  listItem: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
    flex: 1,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  listInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditHiringScreen;
