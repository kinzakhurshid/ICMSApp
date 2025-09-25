import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { Paperclip, ImageIcon, Video, FileText, Headphones } from 'lucide-react-native';
import DocumentPicker, { types } from 'react-native-document-picker';
import ImagePicker from 'react-native-image-crop-picker';
import { validateFileSize, getFileType } from './MessageInput'; // You'll need to export these from MessageInput

interface FileUploadHandlerProps {
  onFilesSelected: (files: any[]) => void;
  onVoiceRecord: () => void;
  uploading?: boolean;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({ 
  onFilesSelected, 
  onVoiceRecord, 
  uploading = false 
}) => {
  const [showFileSelector, setShowFileSelector] = useState(false);

  const makeFileLikeObject = (file: { uri: string; name: string; type: string; size: number }) => {
    const now = Date.now();
    return { ...file, lastModified: now, lastModifiedDate: new Date(now), webkitRelativePath: "" };
  };

  const pickImages = async () => {
    try {
      const selected = await ImagePicker.openPicker({ multiple: true, mediaType: 'photo' });
      
      // Filter out files that are too large
      const validFiles = selected.filter(img => validateFileSize(img.size, 20));
      
      if (validFiles.length !== selected.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }
      
      const files = validFiles.map((img, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: img.path,
          name: img.filename || `image-${i}.jpg`,
          type: img.mime || 'image/jpeg',
          size: img.size,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      
      onFilesSelected(files);
    } catch (err: any) {
      if (err.code !== 'E_PICKER_CANCELLED') console.warn('Image picker error:', err);
    }
  };

  const pickVideos = async () => {
    try {
      const selected = await ImagePicker.openPicker({ multiple: true, mediaType: 'video' });
      
      // Filter out files that are too large
      const validFiles = selected.filter(video => validateFileSize(video.size, 20));
      
      if (validFiles.length !== selected.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }
      
      const files = validFiles.map((video, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: video.path,
          name: video.filename || `video-${i}.mp4`,
          type: video.mime || 'video/mp4',
          size: video.size,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      
      onFilesSelected(files);
    } catch (err: any) {
      if (err.code !== 'E_PICKER_CANCELLED') console.warn('Video picker error:', err);
    }
  };

  const pickDocuments = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [types.pdf, types.doc, types.docx, types.xls, types.xlsx, types.ppt, types.pptx, types.plainText],
        allowMultiSelection: true,
      });

      // Filter out files that are too large
      const validFiles = results.filter(file => validateFileSize(file.size || 0, 20));
      
      if (validFiles.length !== results.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }

      const files = validFiles.map((file, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: file.uri,
          name: file.name || `document-${i}`,
          type: file.type || 'application/octet-stream',
          size: file.size || 0,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      
      onFilesSelected(files);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) Alert.alert('Error', 'Failed to select document.');
    }
  };

  const pickAudio = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [types.audio, 'audio/mpeg', 'audio/wav', 'audio/x-m4a'],
        allowMultiSelection: true,
      });

      // Filter out files that are too large
      const validFiles = results.filter(file => validateFileSize(file.size || 0, 20));
      
      if (validFiles.length !== results.length) {
        Alert.alert(
          'Some files skipped', 
          'One or more files exceed the 20MB size limit and were not selected.'
        );
      }

      const files = validFiles.map((file, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: makeFileLikeObject({
          uri: file.uri,
          name: file.name || `audio-${i}`,
          type: file.type || 'audio/mpeg',
          size: file.size || 0,
        }),
        uploadProgress: 0,
        status: 'pending',
      }));
      
      onFilesSelected(files);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) Alert.alert('Error', 'Failed to select audio file.');
    }
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const permissions =
        Platform.Version >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            ]
          : [
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ];

      const result = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
    } catch (e) {
      console.warn('Permission error:', e);
      return false;
    }
  };

  const handleFileSelect = async (type: 'image' | 'video' | 'document' | 'audio') => {
    const hasPermission = Platform.OS === 'android' ? await requestAndroidPermissions() : true;
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant storage permissions in settings.');
      return;
    }

    if (type === 'image') await pickImages();
    else if (type === 'video') await pickVideos();
    else if (type === 'document') await pickDocuments();
    else if (type === 'audio') await pickAudio();

    setShowFileSelector(false);
  };

  return (
    <View style={fileUploadStyles.container}>
      {showFileSelector && (
        <View style={fileUploadStyles.selectorContainer}>
          <Text style={fileUploadStyles.selectorTitle}>Select File Type</Text>
          <View style={fileUploadStyles.selectorGrid}>
            {['image', 'video', 'document', 'audio'].map((type) => (
              <TouchableOpacity
                key={type}
                style={fileUploadStyles.selectorButton}
                onPress={() => handleFileSelect(type as any)}
              >
                {type === 'image' && <ImageIcon size={24} color="#3b82f6" />}
                {type === 'video' && <Video size={24} color="#3b82f6" />}
                {type === 'document' && <FileText size={24} color="#3b82f6" />}
                {type === 'audio' && <Headphones size={24} color="#3b82f6" />}
                <Text style={fileUploadStyles.selectorLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={fileUploadStyles.buttonsContainer}>
        <TouchableOpacity
          style={fileUploadStyles.attachButton}
          onPress={() => setShowFileSelector((p) => !p)}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator size="small" color="#6b7280" /> : <Paperclip size={20} color="#6b7280" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={fileUploadStyles.voiceButton}
          onPress={onVoiceRecord}
          disabled={uploading}
        >
          <Headphones size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const fileUploadStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachButton: {
    padding: 8,
    borderRadius: 6,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 6,
  },
  selectorContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  selectorButton: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default FileUploadHandler;