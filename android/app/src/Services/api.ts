// src/services/api.ts
import axios from 'axios';
import { Alert, Platform } from 'react-native';

// Configuration - Use deployed server for all environments
const BASE_URL = 'https://intelgency.com/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout for file uploads
  headers: {
    'Accept': 'application/json'
    // Don't set Content-Type here, let axios handle it per request
  }
});

// Request interceptor for logging and FormData handling
api.interceptors.request.use(config => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  
  // Handle FormData requests
  if (config.data instanceof FormData) {
    // Don't set Content-Type for FormData, let axios handle it
    delete config.headers['Content-Type'];
    console.log('[API] FormData request detected, removing Content-Type header');
  } else if (config.data && typeof config.data === 'object') {
    // Set Content-Type for JSON requests
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
}, error => {
  console.error('[API] Request error:', error);
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(response => {
  return response;
}, error => {
  let errorMessage = 'Network error';
  
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        errorMessage = 'Unauthorized - Please login again';
        break;
      case 403:
        errorMessage = 'Forbidden - You don\'t have permission';
        break;
      case 404:
        errorMessage = 'Resource not found';
        break;
      case 500:
        errorMessage = 'Server error - Please try again later';
        break;
      default:
        errorMessage = error.response.data?.message || `Request failed with status ${error.response.status}`;
    }
  } else if (error.request) {
    // No response received
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout - Server is not responding';
    } else {
      errorMessage = 'No network connection - Please check your internet';
    }
  } else {
    // Request setup error
    errorMessage = error.message || 'Request configuration error';
  }

  console.error('[API] Error details:', {
    url: error.config?.url,
    method: error.config?.method,
    error: errorMessage
  });

  return Promise.reject(errorMessage);
});

// Health check endpoint
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      status: response.data.status,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('Server health check failed:', error);
    throw error;
  }
};

// User authentication endpoints
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('/user/login', { email, password });
    
    if (!response.data?.user) {
      throw new Error('Invalid server response format');
    }

    return {
      user: response.data.user,
      token: response.data.token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/user/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

// Protected API endpoints
export const getProtectedData = async (token: string) => {
  try {
    const response = await api.get('/protected/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch protected data:', error);
    throw error;
  }
};

// Error display helper
export const showApiError = (error: unknown) => {
  const message = typeof error === 'string' ? error : 
                 error instanceof Error ? error.message : 
                 'An unknown error occurred';
  
  Alert.alert(
    'Error',
    message,
    [{ text: 'OK', style: 'cancel' }]
  );
};

// ===== CHAT API ENDPOINTS =====

// Message Operations
export const sendMessage = async (chatId: string, messageData: {
  content: string;
  type: 'text' | 'attachment';
  attachments?: any[];
  replyTo?: string;
  mentions?: string[];
}, token: string) => {
  try {
    // Use the correct endpoint that exists on the server
    const response = await api.post(`/chats/send`, {
      chatId,
      content: messageData.content,
      type: messageData.type,
      attachments: messageData.attachments || [],
      replyTo: messageData.replyTo,
      mentions: messageData.mentions || []
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

export const editMessage = async (messageId: string, content: string, token: string) => {
  try {
    const response = await api.put(`/chats/editMessage/${messageId}`, { content }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to edit message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string, token: string) => {
  try {
    const response = await api.delete(`/chats/deleteMessage/${messageId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId: string, page: number = 1, limit: number = 20, token: string) => {
  try {
    const response = await api.get(`/chats/getChatMessages/${chatId}?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
};

export const getMessageById = async (messageId: string, token: string) => {
  try {
    const response = await api.get(`/chats/single/${messageId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch message:', error);
    throw error;
  }
};

// Reactions
export const addReaction = async (messageId: string, emoji: string, token: string) => {
  try {
    const response = await api.post(`/chats/${messageId}/reaction`, { emoji }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add reaction:', error);
    throw error;
  }
};

export const removeReaction = async (messageId: string, emoji: string, token: string) => {
  try {
    const response = await api.delete(`/chats/${messageId}/reaction`, {
      data: { emoji },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to remove reaction:', error);
    throw error;
  }
};

// Pin/Unpin
export const pinMessage = async (messageId: string, token: string) => {
  try {
    const response = await api.post(`/chats/pin/${messageId}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to pin message:', error);
    throw error;
  }
};

export const unpinMessage = async (messageId: string, token: string) => {
  try {
    const response = await api.post(`/chats/unpin/${messageId}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to unpin message:', error);
    throw error;
  }
};

export const getPinnedMessages = async (chatId: string, token: string) => {
  try {
    const response = await api.get(`/chats/pinned/${chatId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pinned messages:', error);
    throw error;
  }
};

// Search
export const searchMessages = async (chatId: string, query: string, page: number = 1, limit: number = 20, token: string) => {
  try {
    const response = await api.get(`/chats/${chatId}/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to search messages:', error);
    throw error;
  }
};

// Member Management
export const getChatMembers = async (chatId: string, token: string) => {
  try {
    const response = await api.get(`/chats/getMemberDetails/${chatId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch chat members:', error);
    throw error;
  }
};

export const addMember = async (chatId: string, userId: string, token: string) => {
  try {
    const response = await api.post(`/chats/addNewMember/${chatId}`, { userId }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add member:', error);
    throw error;
  }
};

export const removeMember = async (chatId: string, userId: string, token: string) => {
  try {
    const response = await api.delete(`/chats/removeGroupMember/${chatId}`, {
      data: { userId },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to remove member:', error);
    throw error;
  }
};

// Read Receipts
export const getReadReceipts = async (messageId: string, token: string) => {
  try {
    const response = await api.get(`/chats/${messageId}/read-receipts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch read receipts:', error);
    throw error;
  }
};

// Upload Attachments
export const uploadAttachment = async (chatId: string, fileData: any, token: string) => {
  // Try different field names that the server might expect
  const fieldNames = ['file', 'attachment', 'image', 'upload'];
  
  for (const fieldName of fieldNames) {
    try {
      const formData = new FormData();
      
      // Create proper file object for React Native
      let fileName = fileData.name || fileData.filename;
      if (!fileName && fileData.uri) {
        try {
          fileName = fileData.uri.split('/').pop() || 'file.jpg';
        } catch (error) {
          fileName = `file_${Date.now()}.jpg`;
        }
      }
      if (!fileName) {
        fileName = `file_${Date.now()}.jpg`;
      }

      const fileObject = {
        uri: fileData.uri,
        type: fileData.type || fileData.mime || 'image/jpeg',
        name: fileName,
      };
      
      formData.append(fieldName, fileObject as any);
      formData.append('chatId', chatId);
      
      console.log(`Trying upload with field name: ${fieldName}`, {
        chatId,
        fileName: fileObject.name,
        fileType: fileObject.type,
        fileUri: fileObject.uri,
        fieldName: fieldName
      });
      
      const response = await fetch(`${BASE_URL}/chats/sendAttachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Upload successful with field name: ${fieldName}`, result);
        return result;
      } else {
        const errorText = await response.text();
        console.log(`Field name ${fieldName} failed:`, response.status, errorText);
        
        // If this is the last field name to try, throw the error
        if (fieldName === fieldNames[fieldNames.length - 1]) {
          throw new Error(`Upload failed: ${response.status} ${errorText}`);
        }
        // Otherwise, continue to next field name
      }
    } catch (error) {
      console.error(`Failed with field name ${fieldName}:`, error);
      
      // If this is the last field name to try, throw the error
      if (fieldName === fieldNames[fieldNames.length - 1]) {
        throw error;
      }
      // Otherwise, continue to next field name
    }
  }
};

export default api;