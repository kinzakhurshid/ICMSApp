import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HelpCenterScreen: React.FC = () => {
  const openWebsite = () => {
    Linking.openURL('https://intelgency.com/contact').catch(() => {});
  };

  const openPhone = () => {
    // Open phone dialer - user can call the number from intelgency.com
    Linking.openURL('tel:').catch(() => {});
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@icmsapp.com').catch(() => {});
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Help Center</Text>
        <Text style={styles.subtitle}>Get assistance with ICMS App</Text>
      </View>

      {/* Contact Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="contact-support" size={24} color="#FF6B35" />
          <Text style={styles.cardTitle}>Contact Support</Text>
        </View>
        <Text style={styles.cardDescription}>
          Need help? Reach out to our support team through any of the following channels:
        </Text>
        
        <TouchableOpacity style={styles.contactRow} onPress={openEmail}>
          <View style={styles.contactIconContainer}>
            <Icon name="email" size={22} color="#FF6B35" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>support@icmsapp.com</Text>
            <Text style={styles.contactNote}>We typically respond within 24 hours</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#a0aec0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={openPhone}>
          <View style={styles.contactIconContainer}>
            <Icon name="phone" size={22} color="#FF6B35" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone Support</Text>
            <Text style={styles.contactValue}>Visit intelgency.com for contact number</Text>
            <Text style={styles.contactNote}>Business hours: Mon-Fri, 9 AM - 6 PM</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#a0aec0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={openWebsite}>
          <View style={styles.contactIconContainer}>
            <Icon name="public" size={22} color="#FF6B35" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Website</Text>
            <Text style={styles.contactValue}>intelgency.com</Text>
            <Text style={styles.contactNote}>Visit our website for more information</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#a0aec0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={openWebsite}>
          <Icon name="open-in-new" size={18} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Visit Support Page</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Help Topics */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="help-outline" size={24} color="#FF6B35" />
          <Text style={styles.cardTitle}>Quick Help Topics</Text>
        </View>
        
        <View style={styles.topicSection}>
          <View style={styles.topicItem}>
            <Icon name="account-circle" size={20} color="#4b5563" />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>Account & Login</Text>
              <Text style={styles.topicDescription}>
                Issues with logging in, password reset, account access, or profile management
              </Text>
            </View>
          </View>

          <View style={styles.topicItem}>
            <Icon name="people" size={20} color="#4b5563" />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>Employee Management</Text>
              <Text style={styles.topicDescription}>
                Adding, editing, or viewing employee information, roles, and permissions
              </Text>
            </View>
          </View>

          <View style={styles.topicItem}>
            <Icon name="event" size={20} color="#4b5563" />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>Leaves & Attendance</Text>
              <Text style={styles.topicDescription}>
                Managing leave requests, attendance tracking, holidays, and time-off policies
              </Text>
            </View>
          </View>

          <View style={styles.topicItem}>
            <Icon name="account-balance-wallet" size={20} color="#4b5563" />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>Payroll & Benefits</Text>
              <Text style={styles.topicDescription}>
                Salary processing, payroll generation, deductions, and financial reports
              </Text>
            </View>
          </View>

          <View style={styles.topicItem}>
            <Icon name="devices" size={20} color="#4b5563" />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>Accessories Management</Text>
              <Text style={styles.topicDescription}>
                Assigning, tracking, and returning company accessories and equipment
              </Text>
            </View>
          </View>

          <View style={styles.topicItem}>
            <Icon name="dashboard" size={20} color="#4b5563" />
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>Dashboard & Reports</Text>
              <Text style={styles.topicDescription}>
                Understanding dashboard metrics, generating reports, and data export
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Common Questions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="quiz" size={24} color="#FF6B35" />
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
        </View>
        
        <View style={styles.faqSection}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I reset my password?</Text>
            <Text style={styles.faqAnswer}>
              Contact your system administrator or HR department to reset your password. 
              They can assist you with account recovery.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I request a leave?</Text>
            <Text style={styles.faqAnswer}>
              Navigate to the Leaves section, click on "Request Leave", fill in the required 
              information including dates and reason, then submit for approval.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I edit my profile information?</Text>
            <Text style={styles.faqAnswer}>
              Yes, go to Account Information in Settings, then select Edit Profile to update 
              your personal details. Some fields may require administrator approval.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I export data?</Text>
            <Text style={styles.faqAnswer}>
              Most tables have an "Export All" button. Click it to download data as an Excel 
              file. Make sure you have the necessary permissions for the data you're exporting.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What should I do if I encounter an error?</Text>
            <Text style={styles.faqAnswer}>
              Note the error message and the screen where it occurred. Contact support via 
              email or phone with these details for faster resolution.
            </Text>
          </View>
        </View>
      </View>

      {/* Troubleshooting */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="build" size={24} color="#FF6B35" />
          <Text style={styles.cardTitle}>Troubleshooting</Text>
        </View>
        
        <View style={styles.troubleshootSection}>
          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>App is slow or not loading</Text>
            <Text style={styles.troubleshootSteps}>
              1. Check your internet connection{'\n'}
              2. Close and restart the app{'\n'}
              3. Clear app cache if the issue persists{'\n'}
              4. Contact support if problem continues
            </Text>
          </View>

          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>Data not appearing correctly</Text>
            <Text style={styles.troubleshootSteps}>
              1. Pull down to refresh the screen{'\n'}
              2. Check your filters and search terms{'\n'}
              3. Verify you have the correct permissions{'\n'}
              4. Log out and log back in
            </Text>
          </View>

          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>Notifications not working</Text>
            <Text style={styles.troubleshootSteps}>
              1. Check notification settings in your device settings{'\n'}
              2. Ensure notifications are enabled in app settings{'\n'}
              3. Verify you're logged in and connected{'\n'}
              4. Restart the app
            </Text>
          </View>
        </View>
      </View>

      {/* Additional Resources */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="book" size={24} color="#FF6B35" />
          <Text style={styles.cardTitle}>Additional Resources</Text>
        </View>
        
        <Text style={styles.resourceText}>
          For detailed documentation, training materials, and additional support resources, 
          please visit our website at intelgency.com or contact your HR administrator.
        </Text>
        
        <Text style={styles.resourceText}>
          Our support team is available to assist you with any questions or concerns 
          regarding the ICMS application.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Still need help? Contact us through any of the channels above.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  contactNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  topicSection: {
    marginTop: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topicContent: {
    flex: 1,
    marginLeft: 12,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  faqSection: {
    marginTop: 8,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  troubleshootSection: {
    marginTop: 8,
  },
  troubleshootItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  troubleshootTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  troubleshootSteps: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  resourceText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default HelpCenterScreen;
