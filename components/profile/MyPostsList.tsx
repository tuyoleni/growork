import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { MyPostCard } from '@/components/content/MyPostCard';
import { useAuth, useMyPosts, useThemeColor } from '@/hooks';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import { PostWithProfile } from '@/hooks/posts';

// Extend PostWithProfile with properties needed by MyPostCard
interface MyPost extends PostWithProfile {
  is_active: boolean;
  applications_count: number;
}

export default function MyPostsList() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { openCreatePostSheet } = useBottomSheetManager({
    onPostSuccess: () => {
      if (user) {
        refreshPosts();
      }
    }
  });

  const {
    posts,
    loading,
    error,
    refresh: refreshPosts,
  } = useMyPosts(user?.id || '');

  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await refreshPosts();
    }
    setRefreshing(false);
  };

  const handlePostStatusUpdate = async (postId: string, status: 'active' | 'inactive') => {
    // TODO: Implement post status update functionality
    console.log('Update post status:', postId, status);
    Alert.alert('Info', 'Post status update functionality coming soon');
  };

  const handlePostDelete = async (postId: string) => {
    // TODO: Implement post deletion functionality
    console.log('Delete post:', postId);
    Alert.alert('Info', 'Post deletion functionality coming soon');
  };

  const renderPostItem = ({ item }: { item: PostWithProfile }) => {
    // Cast to MyPost type with default values for missing properties
    const myPost: MyPost = {
      ...item,
      is_active: true, // Default to active - TODO: get from actual post data
      applications_count: 0, // Default to 0 - TODO: get from actual application count
    };

    return (
      <MyPostCard
        post={myPost}
        onStatusUpdate={handlePostStatusUpdate}
        onDelete={handlePostDelete}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
          Loading your posts...
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color="#FF3B30" />
        <ThemedText style={[styles.errorText, { color: textColor }]}>
          Error loading posts
        </ThemedText>
        <ThemedText style={[styles.errorSubtext, { color: mutedTextColor }]}>
          {error}
        </ThemedText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tintColor }]}
          onPress={handleRefresh}
        >
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderPostItem}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={64} color={mutedTextColor} />
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
            No posts yet
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: mutedTextColor }]}>
            Create your first job post to get started
          </ThemedText>
          <TouchableOpacity
            style={[styles.createPostButton, { backgroundColor: tintColor }]}
            onPress={openCreatePostSheet}
          >
            <ThemedText style={styles.createPostButtonText}>Create Post</ThemedText>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  createPostButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
