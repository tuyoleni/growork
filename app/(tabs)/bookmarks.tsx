'use client'
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CustomOptionStrip from '@/components/ui/CustomOptionStrip';

import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView } from 'react-native';
import BookmarkedContentList from '@/components/content/BookmarkedContentList';
import { PostType } from '@/types/enums';
import { useRouter } from 'expo-router';


const BOOKMARK_CATEGORIES = [
  { icon: 'briefcase', label: 'Jobs' },
  { icon: 'book-open', label: 'News' },
  { icon: 'coffee', label: 'Applications' },
];

export default function Bookmarks() {
  const [selectedCategory, setSelectedCategory] = useState(3); // All category
  const { user } = useAuth();
  const {
    bookmarkedItems,
    loading,
    error,
    fetchBookmarkedContent,
    removeBookmark
  } = useBookmarks();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');

  // Filter items based on selected category
  const getFilteredItems = () => {
    if (selectedCategory === 3) { // All
      return bookmarkedItems;
    } else if (selectedCategory === 0) { // Jobs
      return bookmarkedItems.filter(item =>
        item.type === 'post' && (item.data as any).type === PostType.Job
      );
    } else if (selectedCategory === 1) { // News
      return bookmarkedItems.filter(item =>
        item.type === 'post' && (item.data as any).type === PostType.News
      );
    } else if (selectedCategory === 2) { // Applications
      return bookmarkedItems.filter(item => item.type === 'application');
    }
    return bookmarkedItems;
  };

  const filteredItems = getFilteredItems();

  // Refresh bookmarks
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarkedContent();
    setRefreshing(false);
  };

  const handleItemPress = (item: any) => {
    if (item.type === 'post') {
      // Navigate to post detail
      router.push(`/post/${item.id}`);
    } else if (item.type === 'application') {
      // Navigate to application detail or show application info
      console.log('Application pressed:', item.id);
    }
  };

  const handleRemoveBookmark = async (item: any) => {
    if (item.type === 'post') {
      await removeBookmark(item.id);
    } else if (item.type === 'application') {
      // Applications can't be "unbookmarked" - they're automatically tracked
      console.log('Cannot remove application bookmark');
    }
  };

  const getCategorySubtitle = () => {
    const count = filteredItems.length;
    if (selectedCategory === 0) { // Jobs
      return `${count} saved job${count !== 1 ? 's' : ''}`;
    } else if (selectedCategory === 1) { // News
      return `${count} saved news item${count !== 1 ? 's' : ''}`;
    } else if (selectedCategory === 2) { // Applications
      return `${count} job application${count !== 1 ? 's' : ''}`;
    } else { // All
      return `${count} total bookmark${count !== 1 ? 's' : ''}`;
    }
  };

  const getEmptyText = () => {
    if (selectedCategory === 0) { // Jobs
      return 'No saved jobs yet';
    } else if (selectedCategory === 1) { // News
      return 'No saved news yet';
    } else if (selectedCategory === 2) { // Applications
      return 'No job applications yet';
    } else { // All
      return 'No bookmarks yet';
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Bookmarks Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Bookmarks</ThemedText>
          <ThemedText style={styles.subtitle}>{getCategorySubtitle()}</ThemedText>
        </ThemedView>

        {/* Category Filter */}
        <ThemedView style={styles.categorySection}>
          <CustomOptionStrip
            visibleOptions={BOOKMARK_CATEGORIES}
            selectedIndex={selectedCategory}
            onChange={setSelectedCategory}
            style={styles.categorySelector}
          />
        </ThemedView>

        {/* Bookmarks Content */}
        <ThemedView style={styles.contentSection}>
          {loading && !refreshing && (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={textColor} />
              <ThemedText style={[styles.loadingText, { color: mutedText }]}>
                Loading bookmarks...
              </ThemedText>
            </ThemedView>
          )}

          {error && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
            </ThemedView>
          )}

          <BookmarkedContentList
            items={filteredItems}
            subtitle={getCategorySubtitle()}
            onItemPress={handleItemPress}
            onRemoveBookmark={handleRemoveBookmark}
            emptyText={getEmptyText()}
          />
        </ThemedView>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 16,
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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categorySelector: {
    paddingHorizontal: 0,
  },
  contentSection: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
});