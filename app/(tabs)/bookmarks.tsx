'use client'
import DocumentList from '@/components/content/DocumentList';
import { Document, DocumentType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CustomOptionStrip from '@/components/ui/CustomOptionStrip';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const BOOKMARK_CATEGORIES = [
  { icon: 'briefcase', label: 'Jobs' },
  { icon: 'newspaper', label: 'News' },
  { icon: 'briefcase', label: 'Companies' },
  { icon: 'users', label: 'People' },
  { icon: 'bookmark', label: 'Articles' },
  { icon: 'video', label: 'Videos' },
  { icon: 'file-text', label: 'Documents' },
  { icon: 'link', label: 'Links' },
];

export default function Bookmarks() {
  const [selectedCategory, setSelectedCategory] = useState(6); // Documents category
  const { user } = useAuth();
  const { documents, loading, error, fetchDocuments, deleteDocument } = useDocuments(user?.id);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const backgroundColor = useThemeColor({}, 'background');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)} years ago`;
  };
  
  // Effect to filter documents based on selected category
  useEffect(() => {
    if (documents.length === 0) {
      setFilteredDocuments([]);
      return;
    }
    
    if (selectedCategory === 6) { // Documents category - show all
      setFilteredDocuments(documents);
    } else {
      // Filter based on the document type
      const filtered = documents.filter(doc => {
        // Map document types to categories
        const typeToCategory: Record<DocumentType, number> = {
          [DocumentType.CV]: 0, // Jobs
          [DocumentType.CoverLetter]: 0, // Jobs
          [DocumentType.Certificate]: 4, // Articles
          [DocumentType.Other]: 6, // Documents
        };
        
        return typeToCategory[doc.type] === selectedCategory;
      });
      
      setFilteredDocuments(filtered);
    }
  }, [documents, selectedCategory]);
  
  // Refresh documents
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  const handleCategoryChange = (index: number) => {
    setSelectedCategory(index);
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

  const handleDocumentDelete = async (document: Document) => {
    // Delete the document from Supabase
    await deleteDocument(document.id);
  };

  const getCategoryTitle = () => {
    return BOOKMARK_CATEGORIES[selectedCategory]?.label || 'Bookmarks';
  };

  const getCategorySubtitle = () => {
    if (selectedCategory === 6) { // Documents
      return `${filteredDocuments.length} saved document${filteredDocuments.length !== 1 ? 's' : ''}`;
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
          <CustomOptionStrip
            visibleOptions={BOOKMARK_CATEGORIES}
            selectedIndex={selectedCategory}
            onChange={setSelectedCategory}
            style={styles.categorySelector}
          />
        </View>

        {/* Bookmarks Content */}
        <View style={styles.contentSection}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={textColor} />
            </View>
          )}
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{documents.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Documents</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {new Set(documents.map(doc => doc.type)).size}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Categories</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {documents.filter(doc => {
                  const date = new Date(doc.uploaded_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date > weekAgo;
                }).length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>This Week</ThemedText>
            </View>
          </View>

          {/* Documents List */}
          <DocumentList
            documents={filteredDocuments.map(doc => ({
              ...doc,
              // For compatibility with DocumentList component
              updated: formatDate(doc.uploaded_at),
              category: doc.type
            }))}
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
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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