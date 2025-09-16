// components/FileUploadHandler.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Paperclip, X, FileText, Image as ImageIcon, Video, Music, File } from 'lucide-react-native';
import * as DocumentPicker from 'react-native-document-picker';
import * as ImagePicker from 'react-native-image-picker';
import { Attachment } from '../utills/fileutillity';

interface FileUploadHandlerProps {
  chatId: string;
  onUploadComplete: (attachments: Attachment[]) => void;
}

interface FileWithProgress {
  id: string;
  name: string;
  type: string;
  uri: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  preview?: string;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({ 
  chatId,
  onUploadComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const pickFile = async (type: 'image' | 'video' | 'document' | 'all') => {
    try {
      let result;
      
      if (type === 'image' || type === 'video') {
        const mediaType = type === 'image' ? 'photo' : 'video';
        result = await ImagePicker.launchImageLibrary({
          mediaType,
          includeBase64: false,
          maxHeight: 1000,
          maxWidth: 1000,
          quality: 0.8,
          selectionLimit: 5,
        });
        
        if (result.didCancel) return;
        
        const newFiles = result.assets?.map(asset => ({
          id: Math.random().toString(36).substring(2, 9),
          name: asset.fileName || `file-${Date.now()}`,
          type: asset.type || 'image',
          uri: asset.uri || '',
          progress: 0,
          status: 'pending' as const,
          preview: asset.uri,
        })) || [];
        
        setSelectedFiles(prev => [...prev, ...newFiles]);
        await uploadFiles(newFiles);
      } else {
        result = await DocumentPicker.pick({
          type: type === 'all' 
            ? [DocumentPicker.types.allFiles]
            : [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx],
          allowMultiSelection: true,
        });
        
        const newFiles = result.map(file => ({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name || `file-${Date.now()}`,
          type: file.type || 'application/octet-stream',
          uri: file.uri,
          progress: 0,
          status: 'pending' as const,
        }));
        
        setSelectedFiles(prev => [...prev, ...newFiles]);
        await uploadFiles(newFiles);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        return;
      }
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file in nupload handler');
    }
  };

  const uploadFiles = async (files: FileWithProgress[]) => {
    setIsUploading(true);
    const uploadedAttachments: Attachment[] = [];
    
    for (const file of files) {
      try {
        // Update status to uploading
        setSelectedFiles(prev => prev.map(f => 
          f.id === file.id ? {...f, status: 'uploading'} : f
        ));
        
        const formData = new FormData();
        formData.append('attachment', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
        formData.append('chatId', chatId);
        
        // Simulate upload progress (replace with actual upload)
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setSelectedFiles(prev => prev.map(f => 
            f.id === file.id ? {...f, progress} : f
          ));
        }
        
        // Replace with actual API call
        // const response = await fetch('/api/upload', {
        //   method: 'POST',
        //   body: formData,
        // });
        // const data = await response.json();
        
        // Mock response for demonstration
        const mockResponse = {
          public_id: `file_${Date.now()}`,
          url: file.uri,
          originalName: file.name,
          fileType: file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 
                   file.type.startsWith('audio/') ? 'audio' : 'document',
          size: 1024 * 1024, // 1MB mock size
        };
        
        uploadedAttachments.push(mockResponse);
        
        // Update status to completed
        setSelectedFiles(prev => prev.map(f => 
          f.id === file.id ? {...f, status: 'completed'} : f
        ));
        
        // Remove file after delay
        setTimeout(() => {
          setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
        }, 2000);
        
      } catch (error) {
        console.error('Upload error:', error);
        setSelectedFiles(prev => prev.map(f => 
          f.id === file.id ? {...f, status: 'error'} : f
        ));
        Alert.alert('Error', `Failed to upload ${file.name}`);
      }
    }
    
    if (uploadedAttachments.length > 0) {
      onUploadComplete(uploadedAttachments);
    }
    
    setIsUploading(false);
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} color="#6b7280" />;
    if (type.startsWith('video/')) return <Video size={20} color="#6b7280" />;
    if (type.startsWith('audio/')) return <Music size={20} color="#6b7280" />;
    return <FileText size={20} color="#6b7280" />;
  };

  return (
    <View style={styles.container}>
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <View style={styles.previewsContainer}>
          {selectedFiles.map((file) => (
            <View key={file.id} style={styles.previewItem}>
              {file.preview ? (
                <Image source={{ uri: file.preview }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewIcon}>
                  {getFileIcon(file.type)}
                </View>
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {file.name}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${file.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {file.status === 'uploading' 
                    ? `Uploading... ${file.progress}%` 
                    : file.status === 'completed' 
                      ? 'Uploaded' 
                      : file.status === 'error' 
                        ? 'Error' 
                        : 'Pending'
                  }
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => removeFile(file.id)}
                style={styles.removeButton}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* File Upload Button with Options */}
      <TouchableOpacity 
        style={styles.attachButton}
        onPress={() => {
          Alert.alert(
            'Select File Type',
            'Choose the type of file you want to attach',
            [
              {
                text: 'Image',
                onPress: () => pickFile('image'),
              },
              {
                text: 'Video',
                onPress: () => pickFile('video'),
              },
              {
                text: 'Document',
                onPress: () => pickFile('document'),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        }}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#6b7280" />
        ) : (
          <Paperclip size={20} color="#6b7280" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  previewsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    maxHeight: 200,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 8,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  attachButton: {
    padding: 8,
    borderRadius: 6,
  },
});

export default FileUploadHandler;