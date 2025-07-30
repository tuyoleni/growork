import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Application, ApplicationStatus } from '@/types';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Feather } from '@expo/vector-icons';

type ApplicationsListProps = {
  userId?: string;
  showJobTitle?: boolean;
};

export default function ApplicationsList({ userId, showJobTitle = true }: ApplicationsListProps) {
  const { user } = useAuth();
  const { applications, loading, error, fetchApplications, updateApplicationStatus } = useApplications(userId || user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    if (user?.id || userId) {
      fetchApplications();
    }
  }, [fetchApplications, user?.id, userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (applicationId: string, status: ApplicationStatus) => {
    await updateApplicationStatus(applicationId, status);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.Pending:
        return '#f59e0b'; // Amber
      case ApplicationStatus.Reviewed:
        return '#3b82f6'; // Blue
      case ApplicationStatus.Accepted:
        return '#10b981'; // Green
      case ApplicationStatus.Rejected:
        return '#ef4444'; // Red
      default:
        return textColor;
    }
  };

  const renderApplication = ({ item }: { item: Application }) => {
    interface ApplicationWithRelations extends Application {
      post?: { id: string; title?: string | null };
      user?: { id: string; name?: string; surname?: string };
    }
    
    const application = item as ApplicationWithRelations;
    const statusColor = getStatusColor(item.status);

    return (
      <ThemedView style={[styles.applicationCard, { borderColor }]}>
        <View style={styles.cardHeader}>
          {showJobTitle && application.post?.title && (
            <ThemedText style={styles.jobTitle} type="defaultSemiBold">
              {application.post.title}
            </ThemedText>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.applicantInfo}>
            <ThemedText type="defaultSemiBold">
              {application.user?.name} {application.user?.surname}
            </ThemedText>
            <ThemedText style={styles.dateText}>
              Applied on {new Date(item.created_at).toLocaleDateString()}
            </ThemedText>
          </View>

          <View style={styles.documentLinks}>
            {item.resume_url && (
              <Pressable style={styles.documentLink}>
                <Feather name="file-text" size={16} color={textColor} />
                <ThemedText style={styles.documentLinkText}>Resume</ThemedText>
              </Pressable>
            )}
            {item.cover_letter && (
              <Pressable style={styles.documentLink}>
                <Feather name="file" size={16} color={textColor} />
                <ThemedText style={styles.documentLinkText}>Cover Letter</ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {user?.id !== item.user_id && (
          <View style={styles.cardActions}>
            <Pressable
              style={[styles.actionButton, { borderColor }]}
              onPress={() => handleUpdateStatus(item.id, ApplicationStatus.Accepted)}
              disabled={item.status === ApplicationStatus.Accepted}
            >
              <Feather name="check" size={16} color="#10b981" />
              <ThemedText style={[styles.actionButtonText, { color: '#10b981' }]}>
                Accept
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { borderColor }]}
              onPress={() => handleUpdateStatus(item.id, ApplicationStatus.Reviewed)}
              disabled={item.status === ApplicationStatus.Reviewed}
            >
              <Feather name="eye" size={16} color="#3b82f6" />
              <ThemedText style={[styles.actionButtonText, { color: '#3b82f6' }]}>
                Review
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { borderColor }]}
              onPress={() => handleUpdateStatus(item.id, ApplicationStatus.Rejected)}
              disabled={item.status === ApplicationStatus.Rejected}
            >
              <Feather name="x" size={16} color="#ef4444" />
              <ThemedText style={[styles.actionButtonText, { color: '#ef4444' }]}>
                Reject
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ThemedView>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>No applications found</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  applicationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    gap: 12,
  },
  applicantInfo: {
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.7,
  },
  documentLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  documentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});