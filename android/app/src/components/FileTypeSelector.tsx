import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FileTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'image' | 'video' | 'document' | 'camera') => void;
}

const { width } = Dimensions.get('window');

const FileTypeSelector: React.FC<FileTypeSelectorProps> = ({
  visible,
  onClose,
  onSelectType,
}) => {
  const fileTypes = [
    {
      type: 'camera' as const,
      title: 'Camera',
      subtitle: 'Take a photo',
      icon: 'camera-outline',
      color: '#007AFF',
    },
    {
      type: 'image' as const,
      title: 'Gallery',
      subtitle: 'Choose from gallery',
      icon: 'images-outline',
      color: '#34C759',
    },
    {
      type: 'video' as const,
      title: 'Video',
      subtitle: 'Record or select video',
      icon: 'videocam-outline',
      color: '#FF9500',
    },
    {
      type: 'document' as const,
      title: 'Document',
      subtitle: 'Files, PDFs, etc.',
      icon: 'document-outline',
      color: '#8E8E93',
    },
  ];

  const handleSelect = (type: 'image' | 'video' | 'document' | 'camera') => {
    onSelectType(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select File Type</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* File Type Options */}
          <View style={styles.optionsContainer}>
            {fileTypes.map((fileType) => (
              <TouchableOpacity
                key={fileType.type}
                style={styles.optionItem}
                onPress={() => handleSelect(fileType.type)}
              >
                <View style={[styles.iconContainer, { backgroundColor: fileType.color }]}>
                  <Ionicons name={fileType.icon} size={24} color="#fff" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{fileType.title}</Text>
                  <Text style={styles.optionSubtitle}>{fileType.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default FileTypeSelector;
