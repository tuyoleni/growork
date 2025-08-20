import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ApplicationStatus } from "@/types/enums";
import ScreenContainer from "@/components/ScreenContainer";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import ThemedButton from "@/components/ui/ThemedButton";
import UniversalHeader from "@/components/ui/UniversalHeader";
import { supabase } from "@/utils/supabase";
import { ApplicationCard } from "@/components/content/ApplicationCard";
import { generateStatusUpdateEmail, prepareApplicationAttachments } from "@/utils/emailService";
import { ApplicationFilters } from "@/components/ui/ApplicationFilters";
import { useAuth, useMyPostApplications, useThemeColor } from "@/hooks";
import type { ApplicationWithDetails } from "@/hooks/applications/useMyPostApplications";

type ViewMode = "applications" | "detail";

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
                user_id,
                content,
                created_at,
                updated_at
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

          // Fetch comprehensive profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              id, 
              username, 
              name, 
              surname, 
              avatar_url, 
              bio,
              profession,
              experience_years,
              education,
              skills,
              location,
              phone,
              website
            `)
            .eq('id', applicationData.user_id)
            .single();

          // Fetch company data for the job poster
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', applicationData.posts.user_id)
            .single();

          // Fetch all documents attached to this application
          const { data: documentsData } = await supabase
            .from('documents')
            .select('*')
            .or(`id.eq.${applicationData.resume_id},id.eq.${applicationData.cover_letter_id}`)
            .not('id', 'is', null);

          // Combine all the data
          const applicationWithProfile = {
            ...applicationData,
            profiles: profileData,
            companies: companyData,
            documents: documentsData || []
          };

          setApplication(applicationWithProfile);
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
                user_id,
                content,
                created_at,
                updated_at
              )
            `)
            .eq('post_id', id)
            .order('created_at', { ascending: false });

          if (applicationsError) {
            throw applicationsError;
          }

          // Get user IDs from applications to fetch profiles separately
          const userIds = applicationsData
            ?.map((app: any) => app.user_id)
            .filter(Boolean) || [];

          // Fetch comprehensive profiles for these users
          let profilesData: any[] = [];
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select(`
                id, 
                username, 
                name, 
                surname, 
                avatar_url, 
                bio,
                profession,
                experience_years,
                education,
                skills,
                location,
                phone,
                website
              `)
              .in('id', userIds);
            profilesData = profiles || [];
          }

          // Create a map of user profiles
          const profilesMap = profilesData.reduce((acc: any, profile: any) => {
            acc[profile.id] = profile;
            return acc;
          }, {});

          // Combine applications with their profiles
          const applicationsWithProfiles = applicationsData?.map((app: any) => ({
            ...app,
            profiles: profilesMap[app.user_id] || null
          })) || [];

          setPostApplications(applicationsWithProfiles);
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

              // Auto-send email when status changes to Reviewed
              if (newStatus === ApplicationStatus.Reviewed) {
                const updatedApplication = viewMode === 'detail' && application?.id === applicationId
                  ? { ...application, status: newStatus }
                  : postApplications.find(app => app.id === applicationId);

                if (updatedApplication) {
                  // Show loading indicator
                  Alert.alert('Sending Email', 'Sending notification email to applicant...');

                  try {
                    await handleSendEmail(updatedApplication);
                  } catch (error) {
                    console.error('Auto-email failed:', error);
                    Alert.alert('Email Error', 'Status updated but failed to send notification email');
                  }
                }
              }
            }
          },
        },
      ]
    );
  };

  const handleSendEmail = async (applicationData: any) => {
    try {
      const applicant = applicationData.profiles || {};
      const job = applicationData.posts || {};

      // Validate required data
      if (!job || !job.title) {
        console.error('Job data missing:', job);
        Alert.alert('Error', 'Job information not found');
        return;
      }

      if (!applicant || !applicant.username) {
        console.error('Applicant data missing:', applicant);
        Alert.alert('Error', 'Applicant information not found');
        return;
      }

      // Get company owner email - use current user's email since they are the company owner
      const { data: { session } } = await supabase.auth.getSession();
      const companyOwnerEmail = session?.user?.email;

      if (!companyOwnerEmail) {
        Alert.alert('Error', 'Company owner email not found');
        return;
      }

      // Debug: Log the data we're working with
      console.log('Application Data:', applicationData);
      console.log('Job Data:', job);
      console.log('Applicant Data:', applicant);

      const emailData = {
        ...applicationData,
        appliedDate: new Date(applicationData.created_at).toLocaleDateString()
      };

      const htmlContent = generateStatusUpdateEmail(emailData, applicationData.status);

      // Debug: Log the email content to see what's being sent
      console.log('Email HTML Content:', htmlContent);

      // Call Supabase Edge Function directly with fetch
      const response = await fetch('https://gkjtpxzmbvispwmfgzrc.supabase.co/functions/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify({
          to: companyOwnerEmail,
          subject: `New Application: ${applicant.name && applicant.surname ? `${applicant.name} ${applicant.surname}` : applicant.username} - ${job.title}`,
          html: htmlContent
        })
      });

      const result = await response.json();
      const { data, error } = result;

      if (error) {
        Alert.alert('Error', `Failed to send email: ${error.message}`);
      } else {
        Alert.alert('Success', 'Email sent successfully with document links');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email');
    }
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
    <ScreenContainer>
      <UniversalHeader
        title="Application Details"
        showBackButton={true}
        showNotifications={false}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Applicant
          </ThemedText>
          <View style={styles.applicantRow}>
            <ThemedAvatar
              size={50}
              image={applicant.avatar_url || ''}
            />
            <View style={styles.applicantInfo}>
              <ThemedText style={[styles.applicantName, { color: textColor }]}>
                {applicant.name && applicant.surname
                  ? `${applicant.name} ${applicant.surname}`
                  : applicant.username || 'Unknown User'}
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

        <View style={[styles.separator, { backgroundColor: borderColor }]} />

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Job Details
          </ThemedText>
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

        <View style={[styles.separator, { backgroundColor: borderColor }]} />

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Application Status
          </ThemedText>
          <View style={styles.statusRow}>
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

          {application.status === ApplicationStatus.Pending && (
            <View style={styles.statusButtons}>
              <ThemedButton
                title="Review"
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Reviewed)}
              />
              <ThemedButton
                title="Accept"
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Accepted)}
              />
              <ThemedButton
                title="Reject"
                onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Rejected)}
              />
            </View>
          )}

          {application.status === ApplicationStatus.Reviewed && (
            <>
              <ThemedText style={[styles.statusNote, { color: mutedTextColor }]}>
                Application reviewed. Waiting for final decision.
              </ThemedText>
              <View style={styles.statusButtons}>
                <ThemedButton
                  title="Accept"
                  onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Accepted)}
                />
                <ThemedButton
                  title="Reject"
                  onPress={() => handleApplicationStatusUpdate(application.id, ApplicationStatus.Rejected)}
                />
              </View>
            </>
          )}

          {application.status === ApplicationStatus.Accepted && (
            <ThemedText style={[styles.statusNote, { color: mutedTextColor }]}>
              Application accepted. Notification email sent to company owner.
            </ThemedText>
          )}

          {application.status === ApplicationStatus.Rejected && (
            <ThemedText style={[styles.statusNote, { color: mutedTextColor }]}>
              Application rejected. Notification email sent to company owner.
            </ThemedText>
          )}
        </View>

        {application.cover_letter && (
          <>
            <View style={[styles.separator, { backgroundColor: borderColor }]} />
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Cover Letter
              </ThemedText>
              <ThemedText style={[styles.coverLetterText, { color: textColor }]}>
                {application.cover_letter}
              </ThemedText>
            </View>
          </>
        )}

        {(application.resume_url || application.cover_letter || application.resume_id || application.cover_letter_id) && (
          <>
            <View style={[styles.separator, { backgroundColor: borderColor }]} />
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Attachments (will be included in email)
              </ThemedText>
              {application.resume_url && (
                <View style={styles.attachmentRow}>
                  <Feather name="file-text" size={20} color={tintColor} />
                  <ThemedText style={[styles.attachmentText, { color: textColor }]}>
                    Resume
                  </ThemedText>
                </View>
              )}
              {application.cover_letter && (
                <View style={styles.attachmentRow}>
                  <Feather name="file-text" size={20} color={tintColor} />
                  <ThemedText style={[styles.attachmentText, { color: textColor }]}>
                    Cover Letter
                  </ThemedText>
                </View>
              )}
              {application.resume_id && (
                <View style={styles.attachmentRow}>
                  <Feather name="paperclip" size={20} color={tintColor} />
                  <ThemedText style={[styles.attachmentText, { color: textColor }]}>
                    Additional Resume Document
                  </ThemedText>
                </View>
              )}
              {application.cover_letter_id && (
                <View style={styles.attachmentRow}>
                  <Feather name="paperclip" size={20} color={tintColor} />
                  <ThemedText style={[styles.attachmentText, { color: textColor }]}>
                    Additional Cover Letter Document
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
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
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 4,
  },
  attachmentText: {
    fontSize: 14,
    marginLeft: 8,
  },
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
  statusNote: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
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
