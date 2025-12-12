import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';

interface EmployeeResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  role: string;
  department?: string | { _id: string; name: string };
  position?: string;
  status?: string;
  hireDate?: string;
  probationDate?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  city?: string;
  state?: string;
  taxId?: string | null;
  education?: { degree?: string; institute?: string };
  bankAccount?: { accountNumber?: string; bankName?: string; branch?: string };
  emergencyContact?: { name?: string; relation?: string; phone?: string };
  experiences?: {
    position?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
  }[];
}

type TabKey = 'personal' | 'work' | 'education' | 'experience' | 'financial';

const EmployeeDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const employeeId: string | undefined = route.params?.employeeId;

  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  useEffect(() => {
    if (!employeeId) {
      navigation.goBack();
      return;
    }
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data: EmployeeResponse = await callApi({
        method: 'GET',
        url: `/employee/${employeeId}`,
      });
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!employee) return '';
    const f = employee.firstName?.charAt(0) || '';
    const l = employee.lastName?.charAt(0) || '';
    return (f + l).toUpperCase();
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'Not provided';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Not provided';
    return d.toLocaleDateString('en-GB');
  };

  const renderPersonalTab = () => {
    if (!employee) return null;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        {/* Hire Date */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#ECFEFF' }]}>
              <Icon name="event" size={18} color="#06B6D4" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Hire Date</Text>
              <Text style={styles.infoValue}>{formatDate(employee.hireDate)}</Text>
            </View>
          </View>
        </View>

        {/* Probation Date */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="event-available" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Probation Date</Text>
              <Text style={styles.infoValue}>{formatDate(employee.probationDate)}</Text>
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#EEF2FF' }]}>
              <Icon name="email" size={18} color="#4F46E5" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{employee.email || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="phone" size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{employee.contactNumber || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Gender */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#FFE4E6' }]}>
              <Icon name="wc" size={18} color="#DB2777" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{employee.gender || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="cake" size={18} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{formatDate(employee.dateOfBirth)}</Text>
            </View>
          </View>
        </View>

        {/* Marital Status */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#FEF9C3' }]}>
              <Icon name="favorite" size={18} color="#F97316" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Marital Status</Text>
              <Text style={styles.infoValue}>{employee.maritalStatus || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* City */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="location-city" size={18} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.infoLabel}>City</Text>
              <Text style={styles.infoValue}>{employee.city || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* State */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#E5E7EB' }]}>
              <Icon name="place" size={18} color="#4B5563" />
            </View>
            <View>
              <Text style={styles.infoLabel}>State</Text>
              <Text style={styles.infoValue}>{employee.state || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Nationality */}
        <View style={styles.personalRow}>
          <View style={styles.personalItem}>
            <View style={[styles.personalIcon, { backgroundColor: '#DCFCE7' }]}>
              <Icon name="public" size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Nationality</Text>
              <Text style={styles.infoValue}>{employee.nationality || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencyContainer}>
          <Text style={styles.sectionHeading}>Emergency Contact</Text>
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyItem}>
              <View style={[styles.personalIcon, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="person" size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {employee.emergencyContact?.name || 'Not provided'}
                </Text>
              </View>
            </View>
            <View style={styles.emergencyItem}>
              <View style={[styles.personalIcon, { backgroundColor: '#FFE4E6' }]}>
                <Icon name="groups" size={18} color="#DB2777" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Relation</Text>
                <Text style={styles.infoValue}>
                  {employee.emergencyContact?.relation || 'Not provided'}
                </Text>
              </View>
            </View>
            <View style={styles.emergencyItem}>
              <View style={[styles.personalIcon, { backgroundColor: '#E0F2FE' }]}>
                <Icon name="call" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {employee.emergencyContact?.phone || 'Not provided'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWorkTab = () => {
    if (!employee) return null;
    const departmentName =
      typeof employee.department === 'string'
        ? employee.department
        : employee.department?.name;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Work Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{employee.role || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Position</Text>
          <Text style={styles.infoValue}>{employee.position || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{departmentName || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hire Date</Text>
          <Text style={styles.infoValue}>{formatDate(employee.hireDate)}</Text>
        </View>
      </View>
    );
  };

  const renderEducationTab = () => {
    if (!employee) return null;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Education</Text>
        {employee.education ? (
          <>
            <Text style={styles.infoValue}>{employee.education.degree || 'Not provided'}</Text>
            <Text style={[styles.infoValue, styles.muted]}>
              {employee.education.institute || ''}
            </Text>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="school" size={32} color="#9CA3AF" />
            <Text style={styles.emptyText}>No education record</Text>
          </View>
        )}
      </View>
    );
  };

  const renderExperienceTab = () => {
    if (!employee) return null;
    const experiences = employee.experiences || [];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Work Experience</Text>
        {experiences.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="work-outline" size={32} color="#9CA3AF" />
            <Text style={styles.emptyText}>No work experience recorded</Text>
          </View>
        ) : (
          experiences.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <Text style={styles.infoValue}>{exp.position || 'Position not provided'}</Text>
              <Text style={[styles.infoValue, styles.muted]}>
                {exp.company || 'Company not provided'}
              </Text>
              <Text style={[styles.infoValue, styles.muted]}>
                {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderFinancialTab = () => {
    if (!employee) return null;
    const bank = employee.bankAccount || {};
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tax ID</Text>
          <Text style={styles.infoValue}>{employee.taxId || 'Not provided'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nationality</Text>
          <Text style={styles.infoValue}>{employee.nationality || 'Not provided'}</Text>
        </View>

        <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Bank Account Details</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bank Name</Text>
          <Text style={styles.infoValue}>{bank.bankName || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Number</Text>
          <Text style={styles.infoValue}>{bank.accountNumber || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Branch</Text>
          <Text style={styles.infoValue}>{bank.branch || 'Not provided'}</Text>
        </View>
      </View>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'work':
        return renderWorkTab();
      case 'education':
        return renderEducationTab();
      case 'experience':
        return renderExperienceTab();
      case 'financial':
        return renderFinancialTab();
      default:
        return null;
    }
  };

  if (loading || !employee) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading employee details...</Text>
      </View>
    );
  }

  const departmentName =
    typeof employee.department === 'string' ? employee.department : employee.department?.name;
  const statusLabel = employee.status || 'Active';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.badgesRow}>
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>Active</Text>
                </View>
                <View style={[styles.badge, styles.badgeSecondary]}>
                  <Text style={styles.badgeText}>{employee.role}</Text>
                </View>
              </View>
              <Text style={styles.employeeName}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Text style={styles.employeePosition}>{employee.position || 'Employee'}</Text>
              {departmentName ? (
                <Text style={styles.employeeDepartment}>{departmentName}</Text>
              ) : null}
              <View style={styles.contactRow}>
                <Icon name="email" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{employee.email}</Text>
              </View>
              {employee.contactNumber ? (
                <View style={styles.contactRow}>
                  <Icon name="phone" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>{employee.contactNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          style={styles.tabsScroll}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'personal' && styles.tabItemActive]}
              onPress={() => setActiveTab('personal')}
            >
              <Icon
                name="person"
                size={18}
                color={activeTab === 'personal' ? '#f97316' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'personal' && styles.tabTextActive,
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'work' && styles.tabItemActive]}
              onPress={() => setActiveTab('work')}
            >
              <Icon
                name="work"
                size={18}
                color={activeTab === 'work' ? '#f97316' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'work' && styles.tabTextActive,
                ]}
              >
                Work Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'education' && styles.tabItemActive]}
              onPress={() => setActiveTab('education')}
            >
              <Icon
                name="school"
                size={18}
                color={activeTab === 'education' ? '#f97316' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'education' && styles.tabTextActive,
                ]}
              >
                Education
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'experience' && styles.tabItemActive]}
              onPress={() => setActiveTab('experience')}
            >
              <Icon
                name="history"
                size={18}
                color={activeTab === 'experience' ? '#f97316' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'experience' && styles.tabTextActive,
                ]}
              >
                Experience
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'financial' && styles.tabItemActive]}
              onPress={() => setActiveTab('financial')}
            >
              <Icon
                name="account-balance-wallet"
                size={18}
                color={activeTab === 'financial' ? '#f97316' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'financial' && styles.tabTextActive,
                ]}
              >
                Financial Info
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Content + Side Cards */}
        <View style={styles.contentRow}>
          <View style={styles.contentLeft}>{renderActiveTab()}</View>

          <View style={styles.contentRight}>
            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>Employment Status</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{employee.role || 'Not provided'}</Text>
              </View>
              <View style={styles.infoColumnRow}>
                <Text style={styles.infoLabel}>Hire Date</Text>
                <Text style={styles.infoValue}>{formatDate(employee.hireDate)}</Text>
              </View>
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>Department</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{departmentName || 'Not assigned'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeSecondary: {
    backgroundColor: '#E0EAFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  employeeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#4B5563',
  },
  employeeDepartment: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#4B5563',
  },
  tabsScroll: {
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 4,
  },
  tabItemActive: {
    backgroundColor: '#FFF7ED',
  },
  tabText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
  },
  contentLeft: {
    flex: 2,
    marginRight: 12,
  },
  contentRight: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoColumnRow: {
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
  },
  muted: {
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 13,
  },
  experienceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sideCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  personalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  personalItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyContainer: {
    marginTop: 16,
  },
  emergencyCard: {
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    flexDirection: 'column',
    gap: 10,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default EmployeeDetailScreen;


