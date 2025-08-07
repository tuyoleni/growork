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
  const backgroundColor = useThemeColor({}, 'background');

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

  const handleCategoryChange = (index: number) => {
    setSelectedCategory(index);
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

  const getCategoryTitle = () => {
    return BOOKMARK_CATEGORIES[selectedCategory]?.label || 'Bookmarks';
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

  // Calculate stats
  const stats = {
    total: bookmarkedItems.length,
    jobs: bookmarkedItems.filter(item =>
      item.type === 'post' && (item.data as any).type === PostType.Job
    ).length,
    applications: bookmarkedItems.filter(item => item.type === 'application').length,
    news: bookmarkedItems.filter(item =>
      item.type === 'post' && (item.data as any).type === PostType.News
    ).length,
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bookmarks Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Bookmarks</ThemedText>
          <ThemedText style={styles.subtitle}>Your saved content and job applications</ThemedText>
        </ThemedView>

        {/* Category Filter */}
        <ThemedView style={styles.categorySection}>
          <ThemedText style={styles.sectionTitle}>Filter by Category</ThemedText>
          <CustomOptionStrip
            visibleOptions={BOOKMARK_CATEGORIES}
            selectedIndex={selectedCategory}
            onChange={setSelectedCategory}
            style={styles.categorySelector}
          />
        </ThemedView>

        {/* Stats Row */}
        <ThemedView style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.total}</ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.jobs}</ThemedText>
              <ThemedText style={styles.statLabel}>Jobs</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.applications}</ThemedText>
              <ThemedText style={styles.statLabel}>Applications</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.news}</ThemedText>
              <ThemedText style={styles.statLabel}>News</ThemedText>
            </View>
          </View>
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
            title={getCategoryTitle()}
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
  scrollContent: {
    flexGrow: 1,
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
  categorySection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categorySelector: {
    paddingHorizontal: 0,
  },
  statsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 16,
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