import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Linking,
  Dimensions,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message } from '../types/chattypes';

const { width } = Dimensions.get('window');

interface ChatMediaLinksModalProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
  onMessagePress: (messageId: string) => void;
}

type MediaItem = {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  name: string;
  messageId: string;
  createdAt: string;
  dateGroup: string;
};

type LinkItem = {
  id: string;
  url: string;
  displayUrl: string;
  messageId: string;
  createdAt: string;
  dateGroup: string;
};

const ChatMediaLinksModal: React.FC<ChatMediaLinksModalProps> = ({
  visible,
  onClose,
  messages,
  onMessagePress,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'links'>('media');

  // Get date group key (same as chatWindow)
  const getDateGroupKey = (date: Date | string): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    const messageDateStr = messageDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    if (messageDateStr === todayStr) {
      return 'Today';
    } else if (messageDateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Extract all media items from messages
  const mediaItems = useMemo(() => {
    const items: MediaItem[] = [];
    
    messages.forEach((message) => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach((attachment, index) => {
          const fileType = attachment.fileType || attachment.type || 'unknown';
          let mediaType: 'image' | 'video' | 'file' | 'audio' = 'file';
          
          if (fileType.startsWith('image/') || fileType === 'image') {
            mediaType = 'image';
          } else if (fileType.startsWith('video/') || fileType === 'video') {
            mediaType = 'video';
          } else if (fileType.startsWith('audio/') || fileType === 'audio') {
            mediaType = 'audio';
          }
          
          items.push({
            id: `${message._id}-${index}`,
            type: mediaType,
            url: attachment.url || attachment.uri || '',
            name: attachment.name || attachment.filename || `File ${index + 1}`,
            messageId: message._id,
            createdAt: message.createdAt,
            dateGroup: getDateGroupKey(message.createdAt),
          });
        });
      }
    });
    
    // Sort by date (newest first)
    return items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages]);

  // Extract all links from messages
  const linkItems = useMemo(() => {
    const items: LinkItem[] = [];
    const seenUrls = new Set<string>();
    
    messages.forEach((message) => {
      if (message.content) {
        // URL regex pattern
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
        const matches = message.content.match(urlRegex);
        
        if (matches) {
          matches.forEach((url) => {
            // Normalize URL
            let normalizedUrl = url;
            if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
              normalizedUrl = `https://${normalizedUrl}`;
            }
            
            // Prevent duplicates
            if (!seenUrls.has(normalizedUrl)) {
              seenUrls.add(normalizedUrl);
              items.push({
                id: `${message._id}-${url}`,
                url: normalizedUrl,
                displayUrl: url,
                messageId: message._id,
                createdAt: message.createdAt,
                dateGroup: getDateGroupKey(message.createdAt),
              });
            }
          });
        }
      }
    });
    
    // Sort by date (newest first)
    return items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages]);

  // Group items by date
  const groupedMedia = useMemo(() => {
    const groups: { [key: string]: MediaItem[] } = {};
    mediaItems.forEach((item) => {
      if (!groups[item.dateGroup]) {
        groups[item.dateGroup] = [];
      }
      groups[item.dateGroup].push(item);
    });
    return groups;
  }, [mediaItems]);

  const groupedLinks = useMemo(() => {
    const groups: { [key: string]: LinkItem[] } = {};
    linkItems.forEach((item) => {
      if (!groups[item.dateGroup]) {
        groups[item.dateGroup] = [];
      }
      groups[item.dateGroup].push(item);
    });
    return groups;
  }, [linkItems]);

  const getDateGroupOrder = (groups: { [key: string]: any[] }): string[] => {
    const groupKeys = Object.keys(groups);
    return groupKeys.sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      return new Date(b).getTime() - new Date(a).getTime();
    });
  };


  const renderMediaSection = () => {
    if (mediaItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No media files</Text>
        </View>
      );
    }

    const dateGroups = getDateGroupOrder(groupedMedia);

    return (
      <ScrollView style={styles.content}>
        {dateGroups.map((dateGroup) => (
          <View key={dateGroup} style={styles.dateSection}>
            <Text style={styles.dateHeader}>{dateGroup}</Text>
            <View style={styles.mediaGrid}>
              {groupedMedia[dateGroup].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.mediaItem}
                  onPress={() => onMessagePress(item.messageId)}
                  activeOpacity={0.7}
                >
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.url }} style={styles.mediaThumbnail} />
                  ) : (
                    <View style={styles.mediaIconContainer}>
                      <Ionicons
                        name={
                          item.type === 'video'
                            ? 'videocam'
                            : item.type === 'audio'
                            ? 'musical-notes'
                            : 'document'
                        }
                        size={32}
                        color="#6B7280"
                      />
                    </View>
                  )}
                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.mediaType}>{item.type.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderLinksSection = () => {
    if (linkItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="link-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No links found</Text>
        </View>
      );
    }

    const dateGroups = getDateGroupOrder(groupedLinks);

    return (
      <ScrollView style={styles.content}>
        {dateGroups.map((dateGroup) => (
          <View key={dateGroup} style={styles.dateSection}>
            <Text style={styles.dateHeader}>{dateGroup}</Text>
            {groupedLinks[dateGroup].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.linkItem}
                onPress={() => {
                  Linking.openURL(item.url).catch((err) =>
                    console.error('Failed to open URL:', err)
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.linkIconContainer}>
                  <Ionicons name="link" size={20} color="#3B82F6" />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {item.displayUrl}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onMessagePress(item.messageId);
                    }}
                    style={styles.jumpToMessageButton}
                  >
                    <Text style={styles.jumpToMessageText}>Jump to message</Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="open-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeTab === 'media' ? 'Media' : 'Links'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'media' && styles.activeTab]}
            onPress={() => setActiveTab('media')}
          >
            <Ionicons
              name="images"
              size={20}
              color={activeTab === 'media' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'media' && styles.activeTabText,
              ]}
            >
              Media ({mediaItems.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'links' && styles.activeTab]}
            onPress={() => setActiveTab('links')}
          >
            <Ionicons
              name="link"
              size={20}
              color={activeTab === 'links' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'links' && styles.activeTabText,
              ]}
            >
              Links ({linkItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'media' ? renderMediaSection() : renderLinksSection()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  dateSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 16,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  mediaItem: {
    width: (width - 64) / 3,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaThumbnail: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  mediaIconContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaInfo: {
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  mediaName: {
    fontSize: 12,
    color: '#1F2937',
    marginBottom: 4,
  },
  mediaType: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkUrl: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  jumpToMessageButton: {
    marginTop: 4,
  },
  jumpToMessageText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default ChatMediaLinksModal;

