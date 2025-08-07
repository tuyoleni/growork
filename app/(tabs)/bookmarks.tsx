'use client'
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView } from 'react-native';
import BookmarkedContentList from '@/components/content/BookmarkedContentList';
import { PostType } from '@/types/enums';
import { useRouter } from 'expo-router';



export default function Bookmarks() {
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

  const filteredItems = bookmarkedItems;

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
    return `${count} total bookmark${count !== 1 ? 's' : ''}`;
  };

  const getEmptyText = () => {
    return 'No bookmarks yet';
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Bookmarks Header
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Bookmarks</ThemedText>
          <ThemedText style={styles.subtitle}>{getCategorySubtitle()}</ThemedText>
        </ThemedView> */}

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
            title="Bookmarks"
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
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
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