import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Attachment {
  uri: string;
  type: string;
  name: string;
  size?: number;
  id?: string;
  duration?: number;
  originalName?: string;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  onSendAttachments: () => void;
  onCancelAttachments: () => void;
  isUploading?: boolean;
}

const { width } = Dimensions.get('window');

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments = [],
  onRemoveAttachment,
  onSendAttachments,
  onCancelAttachments,
  isUploading = false,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (!type) return 'document-outline';
    if (type.startsWith('image/')) return 'image-outline';
    if (type.startsWith('audio/')) return 'musical-notes-outline';
    if (type.startsWith('video/')) return 'videocam-outline';
    if (type.includes('pdf')) return 'document-text-outline';
    if (type.includes('word') || type.includes('doc')) return 'document-text-outline';
    if (type.includes('excel') || type.includes('xls')) return 'grid-outline';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'easel-outline';
    if (type.includes('text')) return 'document-text-outline';
    return 'document-outline';
  };

  const getFileTypeColor = (type: string): string => {
    if (!type) return '#9E9E9E';
    if (type.startsWith('image/')) return '#4CAF50';
    if (type.startsWith('audio/')) return '#FF9800';
    if (type.startsWith('video/')) return '#F44336';
    if (type.includes('pdf')) return '#E91E63';
    if (type.includes('word') || type.includes('doc')) return '#2196F3';
    if (type.includes('excel') || type.includes('xls')) return '#4CAF50';
    if (type.includes('powerpoint') || type.includes('ppt')) return '#FF5722';
    if (type.includes('text')) return '#607D8B';
    return '#9E9E9E';
  };

  const getFileTypeName = (type: string): string => {
    if (!type) return 'FILE';
    if (type.startsWith('image/')) return 'IMAGE';
    if (type.startsWith('audio/')) return 'AUDIO';
    if (type.startsWith('video/')) return 'VIDEO';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word') || type.includes('doc')) return 'DOC';
    if (type.includes('excel') || type.includes('xls')) return 'XLS';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'PPT';
    if (type.includes('text')) return 'TXT';
    return type.split('/')[1]?.toUpperCase() || 'FILE';
  };

  const renderImagePreview = (attachment: Attachment, index: number) => {
    const fileName = attachment.originalName || attachment.name || 'Image';
    const fileSize = attachment.size && attachment.size > 0 ? formatFileSize(attachment.size) : null;

    return (
      <View key={`image-${index}`} style={styles.imageContainer}>
        <Image source={{ uri: attachment.uri }} style={styles.imagePreview} />
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveAttachment(index)}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.imageInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName}
            </Text>
            {fileSize && (
              <Text style={styles.fileSize}>
                {fileSize}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFilePreview = (attachment: Attachment, index: number) => {
    const fileName = attachment.originalName || attachment.name || 'File';
    const fileType = attachment.type || 'unknown';
    const fileIcon = getFileIcon(fileType);
    const fileColor = getFileTypeColor(fileType);
    const fileSize = attachment.size && attachment.size > 0 ? formatFileSize(attachment.size) : null;
    const typeDisplay = getFileTypeName(fileType);

    return (
      <View key={`file-${index}`} style={styles.fileContainer}>
        <View style={[styles.fileIconContainer, { backgroundColor: fileColor }]}>
          <Ionicons name={fileIcon} size={28} color="#fff" />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.fileType}>
            {typeDisplay}
          </Text>
          {fileSize && (
            <Text style={styles.fileSize}>
              {fileSize}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButtonSmall}
          onPress={() => onRemoveAttachment(index)}
        >
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAudioPreview = (attachment: Attachment, index: number) => {
    const displayName = attachment.originalName || attachment.name || 'Voice Message';
    const duration = attachment.duration && attachment.duration > 0 ? attachment.duration : 0;
    const fileSize = attachment.size && attachment.size > 0 ? formatFileSize(attachment.size) : null;
    const durationText = duration > 0 ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : null;

    return (
      <View key={`audio-${index}`} style={styles.audioContainer}>
        <View style={styles.audioIconContainer}>
          <Ionicons name="musical-notes" size={36} color="#fff" />
        </View>
        <View style={styles.audioInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.audioType}>Voice Message</Text>
          {durationText && (
            <Text style={styles.fileSize}>
              {durationText}
            </Text>
          )}
          {fileSize && (
            <Text style={styles.fileSize}>
              {fileSize}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButtonSmall}
          onPress={() => onRemoveAttachment(index)}
        >
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAttachment = (attachment: Attachment, index: number) => {
    const attachmentType = attachment.type || 'unknown';
    
    if (attachmentType.startsWith('image/')) {
      return renderImagePreview(attachment, index);
    } else if (attachmentType.startsWith('audio/')) {
      return renderAudioPreview(attachment, index);
    } else {
      return renderFilePreview(attachment, index);
    }
  };

  const attachmentCount = attachments ? attachments.length : 0;
  const attachmentText = attachmentCount === 1 ? 'Attachment' : 'Attachments';
  const sendButtonText = isUploading ? 'Uploading...' : 'Send';

  // Debug logging
  console.log('AttachmentPreview - attachments:', attachments);
  console.log('AttachmentPreview - attachmentCount:', attachmentCount);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="attach" size={20} color="#FF6B35" />
          <Text style={styles.headerTitle}>
            {attachmentCount} {attachmentText}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancelAttachments}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.attachmentsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.attachmentsGrid}>
          {attachments && attachments.length > 0 ? attachments.map((attachment, index) => {
            if (!attachment) return null;
            return renderAttachment(attachment, index);
          }) : (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-upload-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No files selected</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, isUploading && styles.disabledButton]}
          onPress={onCancelAttachments}
          disabled={isUploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sendButton, isUploading && styles.disabledButton]}
          onPress={onSendAttachments}
          disabled={isUploading || !attachments || attachments.length === 0}
        >
          <Text style={styles.sendButtonText}>
            {sendButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    height: '70%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  attachmentsContainer: {
    flex: 1,
    padding: 10,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  imageContainer: {
    width: (width - 40) / 2,
    height: 180,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  imageInfo: {
    marginTop: 5,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    margin: 8,
    width: width - 30,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  fileInfo: {
    flex: 1,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 15,
    margin: 8,
    width: width - 30,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  audioIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  audioInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  audioType: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: '#888',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonSmall: {
    padding: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AttachmentPreview;