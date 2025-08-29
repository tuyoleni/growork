import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import ScreenContainer from "@/components/ScreenContainer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import ThemedButton from "@/components/ui/ThemedButton";
import { ApplicationSkeleton } from "@/components/ui/SkeletonLoader";
import { useAuth, useMyPostApplications, useThemeColor } from "@/hooks";
import { ApplicationStatus } from "@/types/enums";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/DesignSystem";

export default function ApplicationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    applications,
    loading: applicationsLoading,
    error: applicationsError,
    fetchApplicationsForMyPosts,
    updateApplicationStatus,
  } = useMyPostApplications();

  const [refreshing, setRefreshing] = useState(false);

  const textColor = useThemeColor({}, "text");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const tintColor = useThemeColor({}, "tint");

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
      console.error("Error refreshing applications:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchApplicationsForMyPosts]);

  const handleApplicationStatusUpdate = useCallback(
    async (applicationId: string, newStatus: ApplicationStatus) => {
      Alert.alert(
        "Update Status",
        `Are you sure you want to mark this application as ${newStatus}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Update",
            onPress: async () => {
              try {
                const result = await updateApplicationStatus(
                  applicationId,
                  newStatus
                );
                if (result.error) {
                  Alert.alert("Error", "Failed to update application status");
                }
              } catch (error) {
                Alert.alert("Error", "An unexpected error occurred");
              }
            },
          },
        ]
      );
    },
    [updateApplicationStatus]
  );

  const renderApplicationItem = ({ item }: { item: any }) => {
    const applicant = item.profiles || {};
    const post = item.posts || {};
    const company = item.company || {};

    // Get company logo from actual company data
    const companyLogo = company.logo_url;
    const companyName = company.name;

    // Debug: Log the data to see what's available
    console.log("Application item data:", {
      postId: post.id,
      postTitle: post.title,
      company: company,
      companyLogo,
      companyName,
    });

    const getStatusColor = (status: ApplicationStatus) => {
      switch (status) {
        case ApplicationStatus.Pending:
          return Colors.warning;
        case ApplicationStatus.Reviewed:
          return Colors.primary;
        case ApplicationStatus.Accepted:
          return Colors.success;
        case ApplicationStatus.Rejected:
          return Colors.error;
        default:
          return mutedTextColor;
      }
    };

    const getStatusText = (status: ApplicationStatus) => {
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.applicantInfo}>
            <View style={styles.avatarContainer}>
              <ThemedAvatar size={40} image={applicant.avatar_url || ""} />
            </View>
            {(companyLogo || companyName) && (
              <View style={styles.companyAvatarContainer}>
                <ThemedAvatar
                  size={40}
                  image={
                    companyLogo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      companyName || "Company"
                    )}&size=40&background=2563eb&color=ffffff`
                  }
                />
              </View>
            )}
            <View style={styles.applicantDetails}>
              <ThemedText style={styles.applicantName}>
                {applicant.name && applicant.surname
                  ? `${applicant.name} ${applicant.surname}`
                  : applicant.username || "Unknown User"}
              </ThemedText>
              <ThemedText style={styles.jobTitle}>
                {post.title || "Unknown Job"}
              </ThemedText>
            </View>
          </View>
          <ThemedText
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </ThemedText>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => {
              router.push(`/application/${item.id}`);
            }}
          >
            <ThemedText style={[styles.actionText, { color: tintColor }]}>
              View
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (applicationsLoading && !refreshing) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Applications</ThemedText>
          <ThemedText style={styles.subtitle}>Loading...</ThemedText>
        </View>
        <View style={styles.listContainer}>
          {[1, 2, 3].map((index) => (
            <ApplicationSkeleton key={index} />
          ))}
        </View>
      </ScreenContainer>
    );
  }

  if (applicationsError) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>
            Error loading applications
          </ThemedText>
          <TouchableOpacity onPress={() => user && handleRefresh()}>
            <ThemedText style={[styles.actionText, { color: tintColor }]}>
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Applications</ThemedText>
        <ThemedText style={styles.subtitle}>
          {applications.length} total
        </ThemedText>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplicationItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No applications yet
            </ThemedText>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  item: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  applicantInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    width: 40,
    height: 40,
  },
  companyAvatarContainer: {
    marginLeft: -10,
    marginRight: Spacing.xs,
  },
  applicantDetails: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  applicantName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  jobTitle: {
    fontSize: Typography.sm,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  actionText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.base,
  },
  errorText: {
    fontSize: Typography.base,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.base,
  },
});
