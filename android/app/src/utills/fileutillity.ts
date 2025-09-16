// utils/fileUtils.ts
export interface Attachment {
  public_id: string;
  url: string;
  originalName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  size?: number;
  thumbnail?: string;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (fileName: string, mimeType?: string): Attachment['fileType'] => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType?.startsWith('audio/')) return 'audio';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
  if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'].includes(extension || '')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension || '')) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(extension || '')) return 'document';
  
  return 'other';
};