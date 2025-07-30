import DocumentList from '@/components/content/DocumentList';
import { Document, DocumentType } from '@/types';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CustomOptionStrip from '@/components/ui/CustomOptionStrip';
// Import mock data but don't use Document type from dataset
import { MOCK_DOCUMENTS as MOCK_DATA } from '@/dataset/documents';
import { ALL_INDUSTRIES, DEFAULT_INDUSTRIES } from '@/dataset/industries';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState(-1);
  const [visibleIndustries, setVisibleIndustries] = useState(DEFAULT_INDUSTRIES);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const placeholderTextColor = useThemeColor({}, 'mutedText');

  const handleIndustryChange = (index: number) => {
    setSelectedIndustry(index);
    // Filter search results based on industry
    if (searchQuery.trim()) {
      performSearch(searchQuery, index);
    }
  };

  const handleMoreIndustries = () => {
    console.log('Show more industries');
  };

  // Create properly typed mock documents that match our Document interface
  const MOCK_DOCUMENTS: Document[] = [
    {
      id: '1',
      user_id: 'user1',
      type: DocumentType.CV,
      name: 'Tech Resume 2024.pdf',
      file_url: 'https://example.com/resume.pdf',
      uploaded_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'user1',
      type: DocumentType.CoverLetter,
      name: 'Cover Letter - Software Engineer.pdf',
      file_url: 'https://example.com/cover.pdf',
      uploaded_at: new Date().toISOString()
    },
    {
      id: '3',
      user_id: 'user1',
      type: DocumentType.Certificate,
      name: 'AWS Certification.pdf',
      file_url: 'https://example.com/cert.pdf',
      uploaded_at: new Date().toISOString()
    }
  ];

  const performSearch = (query: string, industryIndex: number) => {
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      const filtered = MOCK_DOCUMENTS.filter(doc => 
        doc.name?.toLowerCase().includes(query.toLowerCase()) ||
        doc.type.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      performSearch(text, selectedIndustry);
    } else {
      setSearchResults([]);
    }
  };

  const handleDocumentPress = (document: Document) => {
    console.log('Document pressed:', document.name);
  };

  const handleDocumentDownload = (document: Document) => {
    console.log('Download document:', document.name);
  };

  const handleDocumentShare = (document: Document) => {
    console.log('Share document:', document.name);
  };

  const handleDocumentDelete = (document: Document) => {
    console.log('Delete document:', document.name);
  };

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Search</ThemedText>
          <ThemedText style={styles.subtitle}>Find jobs, companies, and opportunities</ThemedText>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: backgroundSecondary }]}>
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search jobs, companies, skills, documents..."
            placeholderTextColor={placeholderTextColor}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        {/* Industry Filter */}
        <View style={styles.industrySection}>
          <ThemedText style={styles.sectionTitle}>Filter by Industry</ThemedText>
          <CustomOptionStrip
            visibleOptions={visibleIndustries}
            selectedIndex={selectedIndustry}
            onChange={setSelectedIndustry}
            allOptions={ALL_INDUSTRIES}
            minVisibleOptions={1}
            maxVisibleOptions={6}
          />
        </View>

        {/* Search Results */}
        <View style={styles.resultsSection}>
          {searchQuery.trim() ? (
            <>
              <ThemedText style={styles.sectionTitle}>
                {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
              </ThemedText>
              
              {!isSearching && (
                <DocumentList
                  documents={searchResults.map(doc => ({
                    ...doc,
                    // For compatibility with DocumentList component
                    updated: new Date(doc.uploaded_at).toLocaleDateString(),
                    category: doc.type
                  }))}
                  variant="compact"
                  showCategory={true}
                  onDocumentPress={handleDocumentPress}
                  onDocumentDownload={handleDocumentDownload}
                  onDocumentShare={handleDocumentShare}
                  onDocumentDelete={handleDocumentDelete}
                  emptyText={`No documents found for "${searchQuery}" in ${visibleIndustries[selectedIndustry]?.label}`}
                />
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <ThemedText style={styles.placeholderText}>
                Start typing to search documents, jobs, and companies
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  searchContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchInput: {
    fontSize: 16,
    padding: 0,
  },
  industrySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultsSection: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
});