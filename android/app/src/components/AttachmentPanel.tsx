// components/AttachmentsPanel.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Paperclip } from 'lucide-react-native';
import { Attachment } from '../utills/fileutillity';
import AttachmentItem from './AttachmentItems';

interface AttachmentsPanelProps {
  attachments: Attachment[];
  onRemove?: (publicId: string) => void;
  onDownload?: (attachment: Attachment) => void;
  isEditable?: boolean;
}

const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({ 
  attachments, 
  onRemove, 
  onDownload,
  isEditable = false 
}) => {
  if (attachments.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Paperclip size={16} color="#374151" />
        <Text style={styles.title}>
          Attachments ({attachments.length})
        </Text>
      </View>
      
      <ScrollView style={styles.list}>
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.public_id}
            attachment={attachment}
            onRemove={onRemove}
            onDownload={onDownload}
            isEditable={isEditable}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  list: {
    maxHeight: 200,
  },
});

export default AttachmentsPanel;