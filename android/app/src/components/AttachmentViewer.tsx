import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Attachment } from '../types/chattypes';

interface AttachmentViewerProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
  onRemove?: (attachment: Attachment) => void;
  isEditable?: boolean;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  onDownload,
  onRemove,
  isEditable = false,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'image-outline';
      case 'video':
        return 'videocam-outline';
      case 'audio':
        return 'musical-notes-outline';
      default:
        return 'document-outline';
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      if (onDownload) {
        onDownload(attachment);
      } else {
        await Linking.openURL(attachment.url);
      }
    } catch (error) {
      console.error('Failed to open attachment:', error);
      Alert.alert('Error', 'Failed to open attachment');
    }
  };

  const handleRemove = (attachment: Attachment) => {
    if (onRemove) {
      onRemove(attachment);
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="attach" size={16} color="#666" />
          <Text style={styles.headerTitle}>
            Attachments ({attachments.length})
          </Text>
        </View>
      </View>
      
      <View style={styles.attachmentsList}>
        {attachments.map((attachment, index) => (
          <View key={attachment.public_id || index} style={styles.attachmentItem}>
            <View style={styles.attachmentContent}>
              <View style={styles.fileIcon}>
                <Ionicons 
                  name={getFileIcon(attachment.fileType)} 
                  size={20} 
                  color="#666" 
                />
              </View>
              
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {attachment.originalName || attachment.public_id}
                </Text>
                <Text style={styles.fileDetails}>
                  {attachment.fileType?.toUpperCase() || 'FILE'}
                  {attachment.size && ` • ${formatFileSize(attachment.size)}`}
                </Text>
              </View>
            </View>
            
            <View style={styles.actions}>
              {onDownload && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDownload(attachment)}
                >
                  <Ionicons name="download-outline" size={16} color="#666" />
                </TouchableOpacity>
              )}
              
              {isEditable && onRemove && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemove(attachment)}
                >
                  <Ionicons name="close" size={16} color="#f44336" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 6,
  },
  attachmentsList: {
    paddingVertical: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  fileDetails: {
    fontSize: 12,
    color: '#6c757d',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default AttachmentViewer;
