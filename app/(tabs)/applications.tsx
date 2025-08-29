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
import { useAuth, useMyPostApplications, useThemeColor } from "@/hooks";
import { ApplicationStatus } from "@/types/enums";

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
          return "#FFA500";
        case ApplicationStatus.Reviewed:
          return "#007AFF";
        case ApplicationStatus.Accepted:
          return "#34C759";
        case ApplicationStatus.Rejected:
          return "#FF3B30";
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
                  size={36}
                  image={
                    companyLogo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      companyName || "Company"
                    )}&size=36&background=2563eb&color=ffffff`
                  }
                />
              </View>
            )}
            <View style={styles.applicantDetails}>
              <ThemedText style={[styles.applicantName, { color: textColor }]}>
                {applicant.name && applicant.surname
                  ? `${applicant.name} ${applicant.surname}`
                  : applicant.username || "Unknown User"}
              </ThemedText>
              <ThemedText style={[styles.jobTitle, { color: mutedTextColor }]}>
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
            style={styles.viewButton}
            onPress={() => {
              router.push(`/application/${item.id}`);
            }}
          >
            <ThemedText style={[styles.viewButtonText, { color: tintColor }]}>
              View
            </ThemedText>
          </TouchableOpacity>

          {item.status === ApplicationStatus.Pending && (
            <View style={styles.statusActions}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#A8E6CF" }]}
                onPress={() =>
                  handleApplicationStatusUpdate(
                    item.id,
                    ApplicationStatus.Accepted
                  )
                }
              >
                <ThemedText
                  style={[styles.statusButtonText, { color: "#2D5A3D" }]}
                >
                  Accept
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#FFB3BA" }]}
                onPress={() =>
                  handleApplicationStatusUpdate(
                    item.id,
                    ApplicationStatus.Rejected
                  )
                }
              >
                <ThemedText
                  style={[styles.statusButtonText, { color: "#8B2635" }]}
                >
                  Reject
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {item.status === ApplicationStatus.Reviewed && (
            <View style={styles.statusActions}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#A8E6CF" }]}
                onPress={() =>
                  handleApplicationStatusUpdate(
                    item.id,
                    ApplicationStatus.Accepted
                  )
                }
              >
                <ThemedText
                  style={[styles.statusButtonText, { color: "#2D5A3D" }]}
                >
                  Accept
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#FFB3BA" }]}
                onPress={() =>
                  handleApplicationStatusUpdate(
                    item.id,
                    ApplicationStatus.Rejected
                  )
                }
              >
                <ThemedText
                  style={[styles.statusButtonText, { color: "#8B2635" }]}
                >
                  Reject
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (applicationsLoading && !refreshing) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading...
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (applicationsError) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            Error loading applications
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tintColor }]}
            onPress={() => user && handleRefresh()}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Applications
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedTextColor }]}>
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
            <ThemedText style={[styles.emptyText, { color: mutedTextColor }]}>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    marginRight: 4,
  },
  applicantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewButton: {
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusActions: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});
