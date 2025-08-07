'use client'
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import BookmarksHeader from '@/components/ui/BookmarksHeader';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';

import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView } from 'react-native';
import BookmarkedContentList from '@/components/content/BookmarkedContentList';
import { PostType } from '@/types/enums';
import { useRouter } from 'expo-router';




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
      {/* Custom Header */}
      <BookmarksHeader
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        subtitle={getCategorySubtitle()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Bookmarks Content */}
        <ThemedView style={styles.contentSection}>
          {loading && !refreshing && (
            <ThemedView style={styles.loadingContainer}>
              {[1, 2, 3].map((index) => (
                <ContentCardSkeleton key={index} />
              ))}
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
  contentSection: {
    flex: 1,
  },
  loadingContainer: {
    marginBottom: 16,
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