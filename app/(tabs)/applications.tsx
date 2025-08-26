import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ApplicationCard } from '@/components/content/ApplicationCard';
import { ApplicationStats } from '@/components/ui/ApplicationStats';
import UniversalHeader from '@/components/ui/UniversalHeader';
import { usePermissions, useAuth, useMyPostApplications, useApplications, useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import { ApplicationStatus } from '@/types/enums';

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const {
    applications,
    loading: applicationsLoading,
    error: applicationsError,
    fetchApplicationsForMyPosts,
    updateApplicationStatus,
  } = useMyPostApplications();

  const [refreshing, setRefreshing] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');

  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && user.id !== lastUserId.current) {
      lastUserId.current = user.id;
      fetchApplicationsForMyPosts(user.id);
    }
  }, [user?.id, fetchApplicationsForMyPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user) {
        await fetchApplicationsForMyPosts(user.id);
      }
    } catch (error) {
      console.error('Error refreshing applications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchApplicationsForMyPosts]);

  const handleApplicationStatusUpdate = useCallback(async (applicationId: string, newStatus: ApplicationStatus) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to mark this application as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              const result = await updateApplicationStatus(applicationId, newStatus);
              if (result.error) {
                Alert.alert('Error', 'Failed to update application status');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  }, [updateApplicationStatus]);

  const loading = applicationsLoading;
  const error = applicationsError;



  if (loading && !refreshing) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading applications...
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color="#FF3B30" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            Error loading applications
          </ThemedText>
          <ThemedText style={[styles.errorSubtext, { color: mutedTextColor }]}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tintColor }]}
            onPress={() => user && handleRefresh()}
            accessibilityLabel="Retry loading applications"
            accessibilityRole="button"
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <UniversalHeader
        title="Job Applications"
        subtitle="Manage applications for your job posts"
        showNotifications={true}
      />

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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={64} color={mutedTextColor} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              No applications yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: mutedTextColor }]}>
              When candidates apply to your job posts,{'\n'}their applications will appear here
            </ThemedText>
          </View>
        }
      />
    </ScreenContainer>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
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
    lineHeight: 22,
  },
});
