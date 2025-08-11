import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useMyPostApplications, ApplicationWithDetails } from "@/hooks/useMyPostApplications";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ApplicationStatus } from "@/types/enums";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import { supabase } from "@/utils/supabase";
import { ApplicationCard } from "@/components/content/ApplicationCard";
import { ApplicationFilters } from "@/components/ui/ApplicationFilters";

type ViewMode = 'applications' | 'detail';

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { applications, updateApplicationStatus } = useMyPostApplications();
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
  const [postApplications, setPostApplications] = useState<ApplicationWithDetails[]>([]);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('applications');
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const tintColor = useThemeColor({}, "tint");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, try to find if this is an application ID in existing applications
        if (applications.length > 0) {
          const foundApplication = applications.find(app => app.id === id);
          if (foundApplication) {
            setApplication(foundApplication);
            setViewMode('detail');
            setLoading(false);
            return;
          }
        }

        // If not found in applications, check if it's a post ID
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .eq('user_id', user?.id)
          .single();

        if (postError) {
          // If not a post, try as application ID
          const { data: applicationData, error: fetchError } = await supabase
            .from('applications')
            .select(`
              *,
              posts (
                id,
                title,
                type,
                industry,
                criteria,
                user_id
              ),
              profiles!applications_user_id_fkey (
                id,
                username,
                full_name,
                avatar_url,
                bio
              )
            `)
            .eq('id', id)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          if (!applicationData) {
            setError("Application not found");
            setLoading(false);
            return;
          }

          // Check if the current user owns the post
          if (applicationData.posts?.user_id !== user?.id) {
            setError("You don't have permission to view this application");
            setLoading(false);
            return;
          }

          setApplication(applicationData);
          setViewMode('detail');
        } else {
          // It's a post ID, fetch all applications for this post
          setPost(postData);
          setViewMode('applications');

          const { data: applicationsData, error: applicationsError } = await supabase
            .from('applications')
            .select(`
              *,
              posts (
                id,
                title,
                type,
                industry,
                criteria,
                user_id
              ),
              profiles!applications_user_id_fkey (
                id,
                username,
                full_name,
                avatar_url,
                bio
              )
            `)
            .eq('post_id', id)
            .order('created_at', { ascending: false });

          if (applicationsError) {
            throw applicationsError;
          }

          setPostApplications(applicationsData || []);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, applications, user?.id]);

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
            } else {
              // Update local state
              if (viewMode === 'detail' && application?.id === applicationId) {
                setApplication(prev => prev ? { ...prev, status: newStatus } : null);
              }
              setPostApplications(prev =>
                prev.map(app =>
                  app.id === applicationId ? { ...app, status: newStatus } : app
                )
              );
            }
          },
        },
      ]
    );
  };



  const handleBackToApplications = () => {
    setViewMode('applications');
    setApplication(null);
  };

  // Filter applications based on selected filters
  let filteredApplications = postApplications;
  if (selectedStatus) {
    filteredApplications = filteredApplications.filter(app => app.status === selectedStatus);
  }
  if (selectedType) {
    filteredApplications = filteredApplications.filter(app => app.posts?.type === selectedType);
  }
  if (selectedIndustry) {
    filteredApplications = filteredApplications.filter(app => app.posts?.industry === selectedIndustry);
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || (!application && !post)) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            {viewMode === 'applications' ? 'Applications' : 'Application Details'}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#FF3B30" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            {error || "Data not found"}
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButtonAction, { backgroundColor: tintColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (viewMode === 'applications') {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Applications
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {post && (
          <View style={[styles.postHeader, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.postTitle, { color: textColor }]}>
              {post.title}
            </ThemedText>
            <View style={styles.postDetails}>
              <View style={styles.postDetailRow}>
                <Feather name="briefcase" size={16} color={mutedTextColor} />
                <ThemedText style={[styles.postDetailText, { color: mutedTextColor }]}>
                  {post.type}
                </ThemedText>
              </View>
              {post.industry && (
                <View style={styles.postDetailRow}>
                  <Feather name="map-pin" size={16} color={mutedTextColor} />
                  <ThemedText style={[styles.postDetailText, { color: mutedTextColor }]}>
                    {post.industry}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={[styles.applicationsCount, { color: mutedTextColor }]}>
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        )}

        <ApplicationFilters
          selectedStatus={selectedStatus}
          selectedType={selectedType}
          selectedIndustry={selectedIndustry}
          onStatusChange={setSelectedStatus}
          onTypeChange={setSelectedType}
          onIndustryChange={setSelectedIndustry}
        />

        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ApplicationCard
              application={item}
              onStatusUpdate={handleApplicationStatusUpdate}
              showActions={true}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={64} color={mutedTextColor} />
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                No applications yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: mutedTextColor }]}>
                {selectedStatus || selectedType || selectedIndustry
                  ? 'No applications match your filters'
                  : 'Applications for this post will appear here'}
              </ThemedText>
            </View>
          }
        />
      </ThemedView>
    );
  }

  // Detail view for single application
  if (!application) return null;

  const applicant = application.profiles || {};
  const applicationPost = application.posts || {};

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={handleBackToApplications} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          Application Details
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Applicant
          </ThemedText>
          <View style={styles.applicantCard}>
            <ThemedAvatar
              size={60}
              image={applicant.avatar_url || ''}
            />
            <View style={styles.applicantInfo}>
              <ThemedText style={[styles.applicantName, { color: textColor }]}>
                {applicant.full_name || applicant.username || 'Unknown User'}
              </ThemedText>
              <ThemedText style={[styles.applicantUsername, { color: mutedTextColor }]}>
                @{applicant.username || 'unknown'}
              </ThemedText>
              {applicant.bio && (
                <ThemedText style={[styles.applicantBio, { color: mutedTextColor }]}>
                  {applicant.bio}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Job Details
          </ThemedText>
          <View style={[styles.jobCard, { borderColor }]}>
            <ThemedText style={[styles.jobTitle, { color: textColor }]}>
              {applicationPost.title || 'Unknown Job'}
            </ThemedText>
            <View style={styles.jobDetails}>
              <View style={styles.jobDetailRow}>
                <Feather name="briefcase" size={16} color={mutedTextColor} />
                <ThemedText style={[styles.jobDetailText, { color: mutedTextColor }]}>
                  {applicationPost.type || 'Unknown Type'}
                </ThemedText>
              </View>
              {applicationPost.industry && (
                <View style={styles.jobDetailRow}>
                  <Feather name="map-pin" size={16} color={mutedTextColor} />
                  <ThemedText style={[styles.jobDetailText, { color: mutedTextColor }]}>
                    {applicationPost.industry}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Application Status
          </ThemedText>
          <View style={[styles.statusCard, { borderColor }]}>
            <View style={styles.statusHeader}>
              <Feather
                name={getStatusIcon(application.status)}
                size={20}
                color={getStatusColor(application.status)}
              />
              <ThemedText style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </ThemedText>
            </View>
            <ThemedText style={[styles.applicationDate, { color: mutedTextColor }]}>
              Applied on {new Date(application.created_at).toLocaleDateString()}
            </ThemedText>
          </View>

          {application.status === ApplicationStatus.Pending && (
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#007AFF" }]}
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Reviewed)}
              >
                <ThemedText style={styles.statusButtonText}>Review</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#34C759" }]}
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Accepted)}
              >
                <ThemedText style={styles.statusButtonText}>Accept</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#FF3B30" }]}
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Rejected)}
              >
                <ThemedText style={styles.statusButtonText}>Reject</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {application.status === ApplicationStatus.Reviewed && (
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#34C759" }]}
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Accepted)}
              >
                <ThemedText style={styles.statusButtonText}>Accept</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: "#FF3B30" }]}
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Rejected)}
              >
                <ThemedText style={styles.statusButtonText}>Reject</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {application.cover_letter && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Cover Letter
            </ThemedText>
            <View style={[styles.coverLetterCard, { borderColor }]}>
              <ThemedText style={[styles.coverLetterText, { color: textColor }]}>
                {application.cover_letter}
              </ThemedText>
            </View>
          </View>
        )}

        {application.resume_url && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Resume
            </ThemedText>
            <TouchableOpacity style={[styles.resumeCard, { borderColor }]}>
              <Feather name="file-text" size={24} color={tintColor} />
              <ThemedText style={[styles.resumeText, { color: tintColor }]}>
                View Resume
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const getStatusColor = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.Pending:
      return '#FFA500';
    case ApplicationStatus.Reviewed:
      return '#007AFF';
    case ApplicationStatus.Accepted:
      return '#34C759';
    case ApplicationStatus.Rejected:
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
};

const getStatusIcon = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.Pending:
      return 'clock';
    case ApplicationStatus.Reviewed:
      return 'eye';
    case ApplicationStatus.Accepted:
      return 'check-circle';
    case ApplicationStatus.Rejected:
      return 'x-circle';
    default:
      return 'circle';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  postHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  postDetails: {
    gap: 8,
    marginBottom: 8,
  },
  postDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  applicationsCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  applicantCard: { flexDirection: "row", alignItems: "flex-start" },
  applicantInfo: { marginLeft: 16, flex: 1 },
  applicantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  applicantUsername: { fontSize: 14, marginBottom: 4 },
  applicantBio: { fontSize: 14, lineHeight: 20 },
  jobCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  jobDetails: {
    gap: 8,
  },
  jobDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  applicationDate: {
    fontSize: 14,
  },
  statusButtons: { flexDirection: "row", gap: 12 },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  statusButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  coverLetterCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  coverLetterText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resumeCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  resumeText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  backButtonAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: 280,
  },
});
