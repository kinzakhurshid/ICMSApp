import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DocumentCardProps {
  documentName: string;
  fileUrl?: string;
  onDownload?: () => void;
  created?: string;
  lastUpdated?: string;
  priority?: string;
  status?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  documentName,
  fileUrl,
  onDownload,
  created,
  lastUpdated,
  priority,
  status,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (fileUrl) {
      try {
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) {
          await Linking.openURL(fileUrl);
        } else {
          Alert.alert('Error', 'Cannot open this file URL');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open document');
      }
    } else {
      Alert.alert('Error', 'No document URL available');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents & Details</Text>
      
      <View style={styles.documentCard}>
        <View style={styles.documentIcon}>
          <Icon name="description" size={24} color="#f97316" />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{documentName}</Text>
          <Text style={styles.documentType}>File Attachment</Text>
        </View>
        <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
          <Icon name="download" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{formatDate(created)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated</Text>
          <Text style={styles.detailValue}>{formatDate(lastUpdated)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priority</Text>
          <Text style={styles.detailValue}>{priority || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{status || '-'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styling removed - parent card handles it
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#6b7280',
  },
  downloadButton: {
    padding: 8,
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});

export default DocumentCard;

