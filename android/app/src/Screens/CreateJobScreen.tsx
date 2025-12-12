import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';

interface FormData {
  position: string;
  jobType: string;
  officeTiming: string;
  location: string;
  workMode: 'Onsite' | 'Remote';
  startDate: string;
  endDate: string;
  status: 'Open' | 'Closed';
  description: string;
  responsibilities: string[];
  requirements: string[];
  salaryRange: string;
  experienceLevel: string;
  education: string;
  numberOfPositions: string; // keep as string in UI, cast on submit
}

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [formData, setFormData] = useState<FormData>({
    position: '',
    jobType: '',
    officeTiming: '',
    location: '',
    workMode: 'Onsite',
    startDate: '',
    endDate: '',
    status: 'Open',
    description: '',
    responsibilities: [],
    requirements: [],
    salaryRange: '',
    experienceLevel: '',
    education: '',
    numberOfPositions: '1',
  });

  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingResp, setGeneratingResp] = useState(false);
  const [generatingReq, setGeneratingReq] = useState(false);

  const updateField = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.position.trim()) return 'Position is required';
    if (!formData.jobType.trim()) return 'Job type is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.experienceLevel.trim()) return 'Experience level is required';
    if (!formData.education.trim()) return 'Education is required';
    if (!formData.salaryRange.trim()) return 'Salary range is required';
    if (!formData.officeTiming.trim()) return 'Office timing is required';
    if (!formData.startDate.trim()) return 'Start date is required';
    if (!formData.endDate.trim()) return 'End date is required';
    if (!formData.description.trim()) return 'Description is required';
    if (formData.position.length > 100) return 'Position must be 100 characters or less';
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      setLoading(true);

      const numberOfPositions = Number(formData.numberOfPositions) || 1;

      const payload = {
        position: formData.position.trim(),
        jobType: formData.jobType.trim(),
        officeTiming: formData.officeTiming.trim(),
        location: formData.location.trim(),
        workMode: formData.workMode,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        status: formData.status,
        description: formData.description.trim(),
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        salaryRange: formData.salaryRange.trim(),
        experienceLevel: formData.experienceLevel.trim(),
        education: formData.education.trim(),
        numberOfPositions,
        templateId: '1',
      };

      await callApi({
        method: 'POST',
        url: '/hirings',
        data: payload,
      });

      Alert.alert('Success', 'Job opening created successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', 'Failed to create job opening');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResponsibility = () => {
    Alert.prompt(
      'Add Responsibility',
      '',
      (text) => {
        if (text && text.trim()) {
          setFormData(prev => ({
            ...prev,
            responsibilities: [...prev.responsibilities, text.trim()],
          }));
        }
      }
    );
  };

  const handleAddRequirement = () => {
    Alert.prompt(
      'Add Requirement',
      '',
      (text) => {
        if (text && text.trim()) {
          setFormData(prev => ({
            ...prev,
            requirements: [...prev.requirements, text.trim()],
          }));
        }
      }
    );
  };

  const cleanLines = (text: string) =>
    text
      .split(/\r?\n/)
      .map(line =>
        line
          .replace(/^[\-\*\u2022\d\.\)\s]+/, '') // remove bullets/numbers
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
          <Icon name="arrow-back-ios" size={18} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Create New Job Opening</Text>
          <Text style={styles.headerSubtitle}>
            Fill in the details below to create a new job posting
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

        {/* Row: Job Type, Location, Work Mode */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Job Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Full-time"
              placeholderTextColor="#9CA3AF"
              value={formData.jobType}
              onChangeText={(text) => updateField('jobType', text)}
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
            <Text style={styles.label}>Work Mode *</Text>
            <TextInput
              style={styles.input}
              placeholder="Onsite or Remote"
              placeholderTextColor="#9CA3AF"
              value={formData.workMode}
              onChangeText={(text) =>
                updateField('workMode', text.toLowerCase().includes('remote') ? 'Remote' : 'Onsite')
              }
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
            <Text style={styles.label}>Experience Level *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mid Level"
              placeholderTextColor="#9CA3AF"
              value={formData.experienceLevel}
              onChangeText={(text) => updateField('experienceLevel', text)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Education *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BS Computer Science"
              placeholderTextColor="#9CA3AF"
              value={formData.education}
              onChangeText={(text) => updateField('education', text)}
            />
          </View>
        </View>

        {/* Row: Salary, Status, Office Timing */}
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
            <Text style={styles.label}>Status *</Text>
            <TextInput
              style={styles.input}
              placeholder="Open or Closed"
              placeholderTextColor="#9CA3AF"
              value={formData.status}
              onChangeText={(text) =>
                updateField(
                  'status',
                  text.toLowerCase().startsWith('c') ? 'Closed' : 'Open',
                )
              }
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
            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={formData.startDate}
              onChangeText={(text) => updateField('startDate', text)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>End Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={formData.endDate}
              onChangeText={(text) => updateField('endDate', text)}
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
            <TouchableOpacity style={styles.smallButton} onPress={handleAddResponsibility}>
              <Text style={styles.smallButtonText}>Add</Text>
            </TouchableOpacity>
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
          {formData.responsibilities.map((item, idx) => (
            <Text key={idx} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        {/* Requirements */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Requirements *</Text>
            <TouchableOpacity style={styles.smallButton} onPress={handleAddRequirement}>
              <Text style={styles.smallButtonText}>Add</Text>
            </TouchableOpacity>
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
          {formData.requirements.map((item, idx) => (
            <Text key={idx} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Job'}
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

export default CreateJobScreen;


