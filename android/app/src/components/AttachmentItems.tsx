// components/AttachmentItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking } from 'react-native';
import { File, Image as ImageIcon, Video, Headphones, Download, X } from 'lucide-react-native';
import { Attachment, formatFileSize } from '../utills/fileutillity';

interface AttachmentItemProps {
  attachment: Attachment;
  onRemove?: (publicId: string) => void;
  onDownload?: (attachment: Attachment) => void;
  isEditable?: boolean;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({
  attachment,
  onRemove,
  onDownload,
  isEditable = false
}) => {
  const getFileIcon = () => {
    switch (attachment.fileType) {
      case 'image':
        return <ImageIcon size={20} color="#6b7280" />;
      case 'video':
        return <Video size={20} color="#6b7280" />;
      case 'audio':
        return <Headphones size={20} color="#6b7280" />;
      default:
        return <File size={20} color="#6b7280" />;
    }
  };

  const handlePress = async () => {
    try {
      await Linking.openURL(attachment.url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={styles.iconContainer}>
          {getFileIcon()}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {attachment.originalName || attachment.public_id}
          </Text>
          <View style={styles.details}>
            <Text style={styles.type}>{attachment.fileType.toUpperCase()}</Text>
            {attachment.size && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.size}>{formatFileSize(attachment.size)}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        {onDownload && (
          <TouchableOpacity 
            onPress={() => onDownload(attachment)}
            style={styles.actionButton}
          >
            <Download size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
        
        {isEditable && onRemove && (
          <TouchableOpacity 
            onPress={() => onRemove(attachment.public_id)}
            style={styles.actionButton}
          >
            <X size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: 12,
    color: '#6b7280',
  },
  separator: {
    fontSize: 12,
    color: '#6b7280',
    marginHorizontal: 4,
  },
  size: {
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default AttachmentItem;