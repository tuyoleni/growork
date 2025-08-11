import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,

} from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ApplicationCard } from '@/components/content/ApplicationCard';
import { MyPostCard } from '@/components/content/MyPostCard';
import { ApplicationStats } from '@/components/ui/ApplicationStats';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import { usePermissions, useAuth, useMyPostApplications, useMyPosts, useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import { ApplicationStatus } from '@/types/enums';
import { PostWithProfile } from '@/hooks/posts';

// Extend PostWithProfile with properties needed by MyPostCard
interface MyPost extends PostWithProfile {
  is_active: boolean;
  applications_count: number;
}

type TabType = 'applications' | 'posts';

export default function ApplicationsScreen() {
  const { isBusinessUser } = usePermissions();
  const { user } = useAuth();
  const {
    applications,
    loading: applicationsLoading,
    error: applicationsError,
    fetchApplicationsForMyPosts,
    updateApplicationStatus,
  } = useMyPostApplications();

  const {
    posts,
    loading: postsLoading,
    error: postsError,
    refresh: refreshPosts,
  } = useMyPosts(user?.id || '');

  const { openCreatePostSheet } = useBottomSheetManager({
    onPostSuccess: () => {
      if (user) {
        refreshPosts();
      }
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('applications');
  const [refreshing, setRefreshing] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');

  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && user.id !== lastUserId.current) {
      lastUserId.current = user.id;
      fetchApplicationsForMyPosts(user.id);
    }
  }, [user?.id, fetchApplicationsForMyPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([
        fetchApplicationsForMyPosts(user.id),
        refreshPosts(),
      ]);
    }
    setRefreshing(false);
  };

  const handleApplicationStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to mark this application as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const result = await updateApplicationStatus(applicationId, newStatus);
            if (result.error) {
              Alert.alert('Error', 'Failed to update application status');
            }
          },
        },
      ]
    );
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

  // No filtering or grouping needed

  const renderTabButton = (tab: TabType, label: string, count?: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? tintColor : 'transparent',
          borderColor: activeTab === tab ? tintColor : borderColor,
        },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <ThemedText
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tab ? '#FFFFFF' : textColor,
          },
        ]}
      >
        {label}
        {count !== undefined && (
          <ThemedText
            style={[
              styles.tabCount,
              {
                color: activeTab === tab ? '#FFFFFF' : mutedTextColor,
              },
            ]}
          >
            {' '}({count})
          </ThemedText>
        )}
      </ThemedText>
    </TouchableOpacity>
  );

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

  // No filtering needed for posts
  const filteredPosts = posts;

  const loading = applicationsLoading || postsLoading;
  const error = applicationsError || postsError;

  if (!isBusinessUser) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>This area is for business accounts.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#FF3B30" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            Error loading data
          </ThemedText>
          <ThemedText style={[styles.errorSubtext, { color: mutedTextColor }]}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tintColor }]}
            onPress={() => user && handleRefresh()}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          My Applications & Posts
        </ThemedText>
      </View>

      <View style={[styles.tabContainer, { borderBottomColor: borderColor }]}>
        {renderTabButton('applications', 'Applications', applications.length)}
        {renderTabButton('posts', 'My Posts', posts.length)}
      </View>

      {activeTab === 'applications' && (
        <>
          <ApplicationStats applications={applications} />

          <FlatList
            data={applications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ApplicationCard
                key={item.id}
                application={item}
                onStatusUpdate={handleApplicationStatusUpdate}
                showActions={true}
                showPostDetails={true}
              />
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="briefcase" size={64} color={mutedTextColor} />
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                  No applications yet
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: mutedTextColor }]}>
                  Applications for your job posts will appear here
                </ThemedText>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'posts' && (
        <>
          <FlatList
            data={filteredPosts}
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
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabCount: {
    fontSize: 14,
    fontWeight: '400',
  },
  listContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
