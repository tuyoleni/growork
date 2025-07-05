import DocumentList, { Document } from '@/components/content/DocumentList';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IndustrySelector from '@/components/ui/IndustrySelector';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const INDUSTRY_OPTIONS = [
  { icon: 'briefcase', label: 'Marketing' },
  { icon: 'bar-chart', label: 'Sales' },
  { icon: 'pen-tool', label: 'Creative' },
  { icon: 'monitor', label: 'Tech' },
  { icon: 'heart', label: 'Healthcare' },
  { icon: 'book', label: 'Education' },
  { icon: 'shopping-bag', label: 'Retail' },
  { icon: 'truck', label: 'Logistics' },
];

// Mock document data for search
const MOCK_DOCUMENTS: Document[] = [
  {
    name: 'Resume_2024.pdf',
    updated: 'Updated 2 days ago',
    category: 'CV',
    note: 'For tech positions',
  },
  {
    name: 'Portfolio_2024.pdf',
    updated: 'Updated 1 week ago',
    category: 'CV',
    note: 'Design portfolio',
  },
  {
    name: 'CoverLetter_Google.pdf',
    updated: 'Updated 3 days ago',
    category: 'Cover Letter',
    note: 'For Google application',
  },
  {
    name: 'Certificate_React.pdf',
    updated: 'Updated 2 months ago',
    category: 'Certificate',
    note: 'React certification',
  },
];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(0);
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

  const performSearch = (query: string, industryIndex: number) => {
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      const filtered = MOCK_DOCUMENTS.filter(doc => 
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        doc.note?.toLowerCase().includes(query.toLowerCase()) ||
        doc.category?.toLowerCase().includes(query.toLowerCase())
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
          <IndustrySelector
            options={INDUSTRY_OPTIONS}
            selectedIndex={selectedIndustry}
            onChange={handleIndustryChange}
            onMorePress={handleMoreIndustries}
            style={styles.industrySelector}
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
                  documents={searchResults}
                  variant="compact"
                  showCategory={true}
                  onDocumentPress={handleDocumentPress}
                  onDocumentDownload={handleDocumentDownload}
                  onDocumentShare={handleDocumentShare}
                  onDocumentDelete={handleDocumentDelete}
                  emptyText={`No documents found for "${searchQuery}" in ${INDUSTRY_OPTIONS[selectedIndustry]?.label}`}
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
  industrySelector: {
    paddingHorizontal: 0,
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