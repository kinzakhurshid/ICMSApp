import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Message } from '../types/chattypes';
import { searchMessages } from '../Services/api';

interface MessageSearchProps {
  chatId: string;
  onClose: () => void;
  onSelectMessage: (message: Message) => void;
  token: string;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  chatId,
  onClose,
  onSelectMessage,
  token,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const response = await searchMessages(chatId, searchQuery, 1, 20, token);
        setSearchResults(response.messages || []);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        Alert.alert('Error', 'Failed to search messages');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, chatId, token]);

  const handleKeyPress = (key: string) => {
    if (key === 'ArrowDown' || key === 'Enter') {
      if (selectedIndex < searchResults.length - 1) {
        setSelectedIndex(prev => prev + 1);
      }
    } else if (key === 'ArrowUp') {
      if (selectedIndex > 0) {
        setSelectedIndex(prev => prev - 1);
      }
    } else if (key === 'Enter' && selectedIndex >= 0) {
      onSelectMessage(searchResults[selectedIndex]);
    }
  };

  const formatMessagePreview = (content: string) => {
    if (!content) return '';
    const index = content.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index === -1) return content;

    const before = content.substring(0, index);
    const match = content.substring(index, index + searchQuery.length);
    const after = content.substring(index + searchQuery.length);

    return (
      <Text>
        {before}
        <Text style={styles.highlight}>{match}</Text>
        {after}
      </Text>
    );
  };

  const renderSearchResult = ({ item, index }: { item: Message; index: number }) => (
    <TouchableOpacity
      style={[
        styles.resultItem,
        index === selectedIndex && styles.selectedResult
      ]}
      onPress={() => onSelectMessage(item)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.senderName}>{item.sender.name}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.messagePreview} numberOfLines={2}>
        {formatMessagePreview(item.content || '')}
      </Text>
      {item.attachments && item.attachments.length > 0 && (
        <Text style={styles.attachmentIndicator}>
          📎 {item.attachments.length} attachment(s)
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => {
              if (selectedIndex >= 0) {
                onSelectMessage(searchResults[selectedIndex]);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item._id}
          renderItem={renderSearchResult}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.noResultsText}>
            No messages found matching "{searchQuery}"
          </Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </Text>
          <Text style={styles.footerHint}>
            Use ↑↓ to navigate • Enter to select
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedResult: {
    backgroundColor: '#e3f2fd',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  messagePreview: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  highlight: {
    backgroundColor: '#ffeb3b',
    fontWeight: 'bold',
  },
  attachmentIndicator: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footerHint: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default MessageSearch;
