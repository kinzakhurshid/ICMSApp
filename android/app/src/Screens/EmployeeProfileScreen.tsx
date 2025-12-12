import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

const { width } = Dimensions.get('window');

export default function EmployeeProfileScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Personal');
  
  const handleEditProfile = () => {
    (navigation as any).navigate('EditProfile');
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        // Handle both employee and OrgAdmin profiles
        const employeeId = currentUser?.employee?._id || currentUser?.employee?.id || currentUser?._id;
        if (!employeeId) {
          setError('User ID not found');
          return;
        }
        // Try employee endpoint first, fallback to user endpoint for OrgAdmin
        try {
          const response = await callApi({
            method: "GET",
            url: `/employee/${employeeId}`,
          });
          setEmployee(response);
        } catch (employeeError) {
          // If employee endpoint fails, try user endpoint (for OrgAdmin)
          const userResponse = await callApi({
            method: "GET",
            url: `/user/${employeeId}`,
          });
          setEmployee(userResponse);
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [currentUser?.employee?._id, currentUser?._id]);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={styles.loadingText}>Loading profile...</Text>
    </View>
  );

  if (error && !employee) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const tabs = [
    { key: 'Personal', label: 'Personal', icon: 'user' },
    { key: 'WorkDetails', label: 'Work Details', icon: 'briefcase' },
    { key: 'Education', label: 'Education', icon: 'graduation-cap' },
    { key: 'Financial', label: 'Financial Info', icon: 'credit-card' }
  ];

  const renderPersonalTab = () => (
    <View style={styles.tabContent}>
      <InfoCard title="Personal Information">
        <InfoItem icon="user" iconColor="#f97316" label="Full Name" value={`${employee?.firstName || ''} ${employee?.lastName || ''}`} />
        <InfoItem icon="calendar" iconColor="#10B981" label="Hire Date" value={employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not provided'} />
        <InfoItem icon="envelope" iconColor="#3B82F6" label="Email" value={employee?.email || 'Not provided'} />
        <InfoItem icon="phone" iconColor="#06B6D4" label="Phone" value={employee?.contactNumber || employee?.phone || 'Not provided'} />
        <InfoItem icon="user" iconColor="#EC4899" label="Gender" value={employee?.gender || 'Not provided'} />
        <InfoItem icon="calendar" iconColor="#8B5CF6" label="Date of Birth" value={employee?.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'} />
        <InfoItem icon="user" iconColor="#F59E0B" label="Marital Status" value={employee?.maritalStatus || 'Not provided'} />
        <InfoItem icon="map-marker" iconColor="#06B6D4" label="City" value={employee?.city || 'Not provided'} />
        <InfoItem icon="map-marker" iconColor="#8B5CF6" label="State" value={employee?.state || 'Not provided'} />
        <InfoItem icon="user" iconColor="#EF4444" label="Nationality" value={employee?.nationality || 'Not provided'} />
      </InfoCard>

      <InfoCard title="Emergency Contact" cardColor="#FEF2F2">
        <InfoItem icon="user" iconColor="#EF4444" label="Name" value={employee?.emergencyContact?.name || 'Not provided'} textColor="#EF4444" />
        <InfoItem icon="user" iconColor="#EF4444" label="Relation" value={employee?.emergencyContact?.relation || 'Not provided'} textColor="#EF4444" />
        <InfoItem icon="phone" iconColor="#EF4444" label="Phone" value={employee?.emergencyContact?.phone || 'Not provided'} textColor="#EF4444" />
      </InfoCard>
    </View>
  );

  const renderWorkDetailsTab = () => (
    <View style={styles.tabContent}>
      <InfoCard title="Work Information">
        <InfoItem icon="user-tie" iconColor="#3B82F6" label="Position" value={employee?.position || 'Not provided'} />
        <InfoItem icon="building" iconColor="#3B82F6" label="Department" value={
          typeof employee?.department === 'object' && employee?.department !== null 
            ? employee.department.name 
            : employee?.department || 'Not provided'
        } />
        <InfoItem icon="money" iconColor="#3B82F6" label="Salary" value={employee?.salary ? `Rs ${employee.salary}` : 'Not provided'} />
        <InfoItem icon="calendar" iconColor="#3B82F6" label="Job Type" value={employee?.status || 'Not provided'} />
      </InfoCard>

      <InfoCard title="Skills" titleColor="#f97316" titleIcon="wrench">
        {employee?.skills && employee.skills.length > 0 ? (
          <View style={styles.skillsContainer}>
            {employee.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noSkillsText}>No skills listed</Text>
        )}
      </InfoCard>

      <InfoCard title="Employment Status">
        <StatusItem label="Status" value={employee?.status || 'Unknown'} isActive={employee?.isActive} />
        <StatusItem label="Role" value={employee?.role || 'Not assigned'} />
        <StatusItem label="Hire Date" value={employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not provided'} />
      </InfoCard>

      <InfoCard title="Department">
        <DepartmentItem department={
          typeof employee?.department === 'object' && employee?.department !== null 
            ? employee.department.name 
            : employee?.department || 'No department assigned'
        } />
      </InfoCard>
    </View>
  );

  const renderEducationTab = () => (
    <View style={styles.tabContent}>
      <InfoCard title="Education">
        {employee?.education ? (
          <View style={styles.educationItem}>
            <View style={styles.educationIcon}>
              <Icon name="graduation-cap" size={20} color="#10B981" />
            </View>
            <View style={styles.educationInfo}>
              <Text style={styles.educationDegree}>{employee.education.degree || 'Degree not specified'}</Text>
              <Text style={styles.educationUnknown}>{employee.education.institute || 'Institute not specified'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.educationItem}>
            <View style={styles.educationIcon}>
              <Icon name="graduation-cap" size={20} color="#10B981" />
            </View>
            <View style={styles.educationInfo}>
              <Text style={styles.educationDegree}>No education recorded</Text>
              <Text style={styles.educationUnknown}>Please add education details</Text>
            </View>
          </View>
        )}
      </InfoCard>

      <InfoCard title="Employment Status">
        <StatusItem label="Status" value={employee?.status || 'Unknown'} isActive={employee?.isActive} />
        <StatusItem label="Role" value={employee?.role || 'Not assigned'} />
        <StatusItem label="Hire Date" value={employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not provided'} />
      </InfoCard>

      <InfoCard title="Department">
        <DepartmentItem department={
          typeof employee?.department === 'object' && employee?.department !== null 
            ? employee.department.name 
            : employee?.department || 'No department assigned'
        } />
      </InfoCard>
    </View>
  );

  const renderFinancialTab = () => (
    <View style={styles.tabContent}>
      <InfoCard title="Financial Information">
        <InfoItem icon="id-card" iconColor="#10B981" label="Tax ID" value={employee?.taxId || 'Not provided'} />
        <InfoItem icon="user" iconColor="#3B82F6" label="Nationality" value={employee?.nationality || 'Not provided'} />
      </InfoCard>

      <InfoCard title="Bank Account Details" cardColor="#F0F9FF">
        {employee?.bankAccount ? (
          <>
            <InfoItem icon="building" iconColor="#3B82F6" label="Bank Name" value={employee.bankAccount.bankName || 'Not provided'} labelColor="#3B82F6" />
            <InfoItem icon="credit-card" iconColor="#3B82F6" label="Account Number" value={employee.bankAccount.accountNumber || 'Not provided'} labelColor="#3B82F6" />
            <InfoItem icon="map-marker" iconColor="#3B82F6" label="Branch" value={employee.bankAccount.branch || 'Not provided'} labelColor="#3B82F6" />
          </>
        ) : (
          <Text style={styles.noSkillsText}>No bank account details provided</Text>
        )}
      </InfoCard>

      <InfoCard title="Employment Status">
        <StatusItem label="Status" value={employee?.status || 'Unknown'} isActive={employee?.isActive} />
        <StatusItem label="Role" value={employee?.role || 'Not assigned'} />
        <StatusItem label="Hire Date" value={employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not provided'} />
      </InfoCard>

      <InfoCard title="Department">
        <DepartmentItem department={
          typeof employee?.department === 'object' && employee?.department !== null 
            ? employee.department.name 
            : employee?.department || 'No department assigned'
        } />
      </InfoCard>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Personal': return renderPersonalTab();
      case 'WorkDetails': return renderWorkDetailsTab();
      case 'Education': return renderEducationTab();
      case 'Financial': return renderFinancialTab();
      default: return renderPersonalTab();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton}>
              <Icon name="arrow-left" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Employee Profile</Text>
            <Text style={styles.headerSubtitle}>Detailed information about {employee?.firstName || ''} {employee?.lastName || ''}</Text>
          </View>
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
          {employee?.profileImage || employee?.user?.profilePic ? (
            <Image 
              source={{ uri: employee.profileImage || employee.user.profilePic }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {(employee?.firstName?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.profileBadges}>
          <View style={[styles.badge, employee?.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.badgeText, employee?.isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
              {employee?.status || 'Unknown'}
            </Text>
          </View>
          <View style={[styles.badge, styles.badgeBlue]}>
            <Text style={[styles.badgeText, styles.badgeTextBlue]}>{employee?.role || 'Employee'}</Text>
          </View>
        </View>

        <Text style={styles.profileName}>{employee?.firstName || ''} {employee?.lastName || ''}</Text>
        <Text style={styles.profileRole}>{employee?.position || 'No position assigned'}</Text>
        <Text style={styles.profileDepartment}>
          {typeof employee?.department === 'object' && employee?.department !== null 
            ? employee.department.name 
            : employee?.department || 'No department assigned'}
        </Text>

        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Icon name="envelope" size={14} color="#6B7280" />
            <Text style={styles.contactText}>{employee?.email || 'No email'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Icon name="phone" size={14} color="#6B7280" />
            <Text style={styles.contactText}>{employee?.contactNumber || employee?.phone || 'No phone'}</Text>
          </View>
        </View>
      </View>

      {/* Edit Profile Button - moved below profile overview */}
      <View style={styles.editButtonContainer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Icon name="pencil" size={16} color="#FFFFFF" style={styles.editButtonIcon} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.key ? '#f97316' : '#6B7280'} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </ScrollView>
  );
}

function InfoCard({ title, titleColor = '#1E293B', titleIcon = null, cardColor = '#FFFFFF', children }: { title: string; titleColor?: string; titleIcon?: string | null; cardColor?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
      <View style={styles.cardHeader}>
        {titleIcon && <Icon name={titleIcon} size={16} color={titleColor} style={styles.titleIcon} />}
        <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoItem({ icon, iconColor, label, value, labelColor = '#6B7280', textColor = '#1E293B' }) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, { backgroundColor: `${iconColor}20` }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
}

function StatusItem({ label, value, isActive = false }) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.statusLabel}>{label}</Text>
      {isActive ? (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.statusValue}>{value}</Text>
      )}
    </View>
  );
}

function DepartmentItem({ department }) {
  return (
    <View style={styles.departmentItem}>
      <View style={styles.departmentIcon}>
        <Icon name="building" size={20} color="#3B82F6" />
      </View>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{department}</Text>
        <Text style={styles.departmentLabel}>Department</Text>
      </View>
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    marginRight: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  editButtonIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Profile Card Styles
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    marginTop: -40,
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileBadges: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  badgeTextBlue: {
    color: '#2563EB',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  profileDepartment: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  contactInfo: {
    width: '100%',
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Tabs Styles
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by text and icon colors
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
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#f97316',
    borderRadius: 1,
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingVertical: 16,
    gap: 16,
  },
  
  // Card Styles
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  
  // Info Item Styles
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  
  // Status Item Styles
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  
  // Department Item Styles
  departmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  departmentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  departmentLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Education Styles
  educationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  educationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  educationInfo: {
    flex: 1,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  educationUnknown: {
    fontSize: 14,
    color: '#f97316',
  },
  noSkillsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Profile Image Placeholder
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  
  // Badge Styles
  inactiveBadge: {
    backgroundColor: '#FEF2F2',
  },
  inactiveBadgeText: {
    color: '#DC2626',
  },
  
  // Skills Styles
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
  },
});