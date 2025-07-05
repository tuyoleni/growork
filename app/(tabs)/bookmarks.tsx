import DocumentList, { Document } from '@/components/content/DocumentList';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IndustrySelector from '@/components/ui/IndustrySelector';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const BOOKMARK_CATEGORIES = [
  { icon: 'briefcase', label: 'Jobs' },
  { icon: 'newspaper', label: 'News' },
  { icon: 'building', label: 'Companies' },
  { icon: 'users', label: 'People' },
  { icon: 'bookmark', label: 'Articles' },
  { icon: 'video', label: 'Videos' },
  { icon: 'file-text', label: 'Documents' },
  { icon: 'link', label: 'Links' },
];

// Mock bookmarked documents
const BOOKMARKED_DOCUMENTS: Document[] = [
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

export default function Bookmarks() {
  const [selectedCategory, setSelectedCategory] = useState(6); // Documents category
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(BOOKMARKED_DOCUMENTS);
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');

  const handleCategoryChange = (index: number) => {
    setSelectedCategory(index);
    
    // Filter documents based on category
    if (index === 6) { // Documents category
      setFilteredDocuments(BOOKMARKED_DOCUMENTS);
    } else {
      // For other categories, you would filter different types of bookmarks
      setFilteredDocuments([]);
    }
  };

  const handleMoreCategories = () => {
    console.log('Show more categories');
  };

  const handleDocumentPress = (document: Document) => {
    console.log('Bookmarked document pressed:', document.name);
  };

  const handleDocumentDownload = (document: Document) => {
    console.log('Download bookmarked document:', document.name);
  };

  const handleDocumentShare = (document: Document) => {
    console.log('Share bookmarked document:', document.name);
  };

  const handleDocumentDelete = (document: Document) => {
    console.log('Remove from bookmarks:', document.name);
    // Remove from bookmarks
    setFilteredDocuments(prev => prev.filter(doc => doc.name !== document.name));
  };

  const getCategoryTitle = () => {
    return BOOKMARK_CATEGORIES[selectedCategory]?.label || 'Bookmarks';
  };

  const getCategorySubtitle = () => {
    if (selectedCategory === 6) { // Documents
      return `${filteredDocuments.length} bookmarked documents`;
    }
    return 'No bookmarks in this category';
  };

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        {/* Bookmarks Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Bookmarks</ThemedText>
          <ThemedText style={styles.subtitle}>Your saved content and opportunities</ThemedText>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ThemedText style={styles.sectionTitle}>Filter by Category</ThemedText>
          <IndustrySelector
            options={BOOKMARK_CATEGORIES}
            selectedIndex={selectedCategory}
            onChange={handleCategoryChange}
            onMorePress={handleMoreCategories}
            style={styles.categorySelector}
          />
        </View>

        {/* Bookmarks Content */}
        <View style={styles.contentSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>24</ThemedText>
              <ThemedText style={styles.statLabel}>Total Bookmarks</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>8</ThemedText>
              <ThemedText style={styles.statLabel}>Categories</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>3</ThemedText>
              <ThemedText style={styles.statLabel}>This Week</ThemedText>
            </View>
          </View>

          {/* Documents List */}
          <DocumentList
            documents={filteredDocuments}
            title={getCategoryTitle()}
            subtitle={getCategorySubtitle()}
            variant="compact"
            showCategory={true}
            onDocumentPress={handleDocumentPress}
            onDocumentDownload={handleDocumentDownload}
            onDocumentShare={handleDocumentShare}
            onDocumentDelete={handleDocumentDelete}
            emptyText={`No ${getCategoryTitle().toLowerCase()} bookmarks yet`}
          />
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
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categorySelector: {
    paddingHorizontal: 0,
  },
  contentSection: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});