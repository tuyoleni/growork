import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ApplicationStatus } from "@/types/enums";
import ScreenContainer from "@/components/ScreenContainer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import ThemedButton from "@/components/ui/ThemedButton";
import { ThemedIconButton } from "@/components/ui/ThemedIconButton";
import { useThemeColor } from "@/hooks";
import { supabase } from "@/utils/supabase";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/DesignSystem";

interface ApplicationData {
  id: string;
  user_id: string;
  post_id: string;
  resume_id: string | null;
  cover_letter_id: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
  posts: {
    id: string;
    title: string;
    content: string | null;
    type: string | null;
    industry: string | null;
    image_url: string | null;
    criteria: any;
  } | null;
  profiles: {
    id: string;
    username: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
    bio: string | null;
    profession: string | null;
    phone: string | null;
    website: string | null;
    location: string | null;
    experience_years: number | null;
    education: string | null;
    skills: string[] | null;
  } | null;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const tintColor = useThemeColor({}, "tint");

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!id) {
        setError("No ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch application with post data
        const { data: applicationData, error: applicationError } =
          await supabase
            .from("applications")
            .select(
              `
              *,
              posts (
                id,
                title,
              content,
                type,
                industry,
              image_url,
              criteria
            )
          `
            )
            .eq("id", id)
            .single();

        if (applicationError) {
          console.error("Application query error:", applicationError);
          throw applicationError;
        }

        if (!applicationData) {
          setError("Application not found");
          setLoading(false);
          return;
        }

        // Fetch applicant profile
        const { data: applicantData, error: applicantError } = await supabase
          .from("profiles")
          .select(
            "id, username, name, surname, avatar_url, bio, profession, phone, website, location, experience_years, education, skills"
          )
          .eq("id", applicationData.user_id)
          .single();

        if (applicantError) {
          console.error("Applicant query error:", applicantError);
        }

        // Fetch company data if available
        let companyData = null;
        if (applicationData.posts?.criteria?.companyId) {
          const { data: company, error: companyError } = await supabase
            .from("companies")
            .select("id, name, logo_url")
            .eq("id", applicationData.posts.criteria.companyId)
            .single();

          if (!companyError && company) {
            companyData = company;
          }
        }

        // Combine data
        const applicationWithDetails: ApplicationData = {
          ...applicationData,
          posts: applicationData.posts,
          profiles: applicantData,
          companies: companyData,
        };

        setApplication(applicationWithDetails);
      } catch (err: any) {
        console.error("Error fetching application details:", err);
        setError(err.message || "Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [id]);

  const handleApplicationStatusUpdate = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    Alert.alert(
      "Update Status",
      `Are you sure you want to mark this application as ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("applications")
                .update({ status: newStatus })
                .eq("id", applicationId);

              if (error) {
                Alert.alert("Error", "Failed to update application status");
                return;
              }

              setApplication((prev: any) =>
                prev ? { ...prev, status: newStatus } : null
              );

              Alert.alert("Success", "Application status updated successfully");
            } catch {
              Alert.alert("Error", "Failed to update application status");
            }
          },
        },
      ]
    );
  };

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
        return Colors.gray600;
    }
  };

  const getStatusText = (status: ApplicationStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading application...
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !application) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            {error || "Application not found"}
          </ThemedText>
          <ThemedButton
            title="Go Back"
            onPress={() => router.back()}
            style={{ backgroundColor: Colors.primary }}
            textStyle={{ color: Colors.white }}
          />
        </View>
      </ScreenContainer>
    );
  }

  const post = application.posts;
  const applicant = application.profiles;
  const company = application.companies;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedIconButton
          icon={<Feather name="arrow-left" size={24} color={textColor} />}
          onPress={() => router.back()}
        />
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
          {company?.name
            ? `${company.name} - Application`
            : "Application Details"}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Context Card */}
        {company && (
          <View
            style={[styles.companyCard, { backgroundColor: Colors.gray50 }]}
          >
            <View style={styles.companyHeader}>
              <ThemedAvatar
                size={60}
                image={
                  company.logo_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    company.name
                  )}&size=60&background=2563eb&color=ffffff`
                }
              />
              <View style={styles.companyInfo}>
                <ThemedText style={[styles.companyName, { color: textColor }]}>
                  {company.name}
                </ThemedText>
                <ThemedText
                  style={[styles.companyTagline, { color: mutedTextColor }]}
                >
                  Hiring for {post?.title || "Position"}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Job Position */}
        <View style={styles.section}>
          <View style={styles.positionCard}>
            <ThemedText style={[styles.positionTitle, { color: textColor }]}>
              {post?.title || "Job Position"}
            </ThemedText>

            <View style={styles.positionDetails}>
              {post?.type && (
                <View style={styles.detailChip}>
                  <Feather name="briefcase" size={14} color={mutedTextColor} />
                  <ThemedText
                    style={[styles.detailText, { color: mutedTextColor }]}
                  >
                    {post.type}
                  </ThemedText>
                </View>
              )}

              {post?.industry && (
                <View style={styles.detailChip}>
                  <Feather name="briefcase" size={14} color={mutedTextColor} />
                  <ThemedText
                    style={[styles.detailText, { color: mutedTextColor }]}
                  >
                    {post.industry}
                  </ThemedText>
                </View>
              )}

              {post?.criteria?.location && (
                <View style={styles.detailChip}>
                  <Feather name="map-pin" size={14} color={mutedTextColor} />
                  <ThemedText
                    style={[styles.detailText, { color: mutedTextColor }]}
                  >
                    {post.criteria.location}
                  </ThemedText>
                </View>
              )}
            </View>

            {post?.content && (
              <View style={styles.descriptionContainer}>
                <ThemedText
                  style={[styles.descriptionText, { color: textColor }]}
                >
                  {post.content}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Applicant Profile */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Meet the Applicant
          </ThemedText>
          <View style={styles.applicantCard}>
            <View style={styles.applicantHeader}>
              <View style={styles.userAvatarContainer}>
                <ThemedAvatar
                  size={70}
                  image={
                    applicant?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      applicant?.name && applicant?.surname
                        ? `${applicant.name}+${applicant.surname}`
                        : applicant?.username || "User"
                    )}&size=70&background=10b981&color=ffffff`
                  }
                />
                <View
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: Colors.success },
                  ]}
                />
              </View>

              <View style={styles.applicantInfo}>
                <ThemedText
                  style={[styles.applicantName, { color: textColor }]}
                >
                  {applicant?.name && applicant?.surname
                    ? `${applicant.name} ${applicant.surname}`
                    : applicant?.username || "Anonymous Applicant"}
                </ThemedText>

                {applicant?.profession && (
                  <View style={styles.professionBadge}>
                    <Feather
                      name="briefcase"
                      size={14}
                      color={Colors.success}
                    />
                    <ThemedText
                      style={[styles.professionText, { color: Colors.success }]}
                    >
                      {applicant.profession}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.usernameRow}>
                  <Feather name="user" size={14} color={mutedTextColor} />
                  <ThemedText
                    style={[
                      styles.applicantUsername,
                      { color: mutedTextColor },
                    ]}
                  >
                    @{applicant?.username || "user"}
                  </ThemedText>
                </View>

                {applicant?.bio && (
                  <View style={styles.bioContainer}>
                    <Feather
                      name="message-square"
                      size={14}
                      color={mutedTextColor}
                    />
                    <ThemedText
                      style={[styles.userBio, { color: mutedTextColor }]}
                    >
                      &ldquo;{applicant.bio}&rdquo;
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Contact Information */}
            {(applicant?.phone ||
              applicant?.website ||
              applicant?.location) && (
              <View style={styles.contactSection}>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  Contact
                </ThemedText>

                {applicant?.phone && (
                  <View style={styles.contactItem}>
                    <Feather name="phone" size={16} color={mutedTextColor} />
                    <ThemedText
                      style={[styles.contactText, { color: textColor }]}
                    >
                      {applicant.phone}
                    </ThemedText>
                  </View>
                )}

                {applicant?.website && (
                  <View style={styles.contactItem}>
                    <Feather name="globe" size={16} color={mutedTextColor} />
                    <ThemedText
                      style={[styles.contactText, { color: textColor }]}
                    >
                      {applicant.website}
                    </ThemedText>
                  </View>
                )}

                {applicant?.location && (
                  <View style={styles.contactItem}>
                    <Feather name="map-pin" size={16} color={mutedTextColor} />
                    <ThemedText
                      style={[styles.contactText, { color: textColor }]}
                    >
                      {applicant.location}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Experience & Skills */}
            {(applicant?.experience_years ||
              applicant?.education ||
              applicant?.skills) && (
              <View style={styles.experienceSection}>
                {applicant?.experience_years && (
                  <View style={styles.experienceItem}>
                    <ThemedText
                      style={[
                        styles.experienceLabel,
                        { color: mutedTextColor },
                      ]}
                    >
                      Experience
                    </ThemedText>
                    <ThemedText
                      style={[styles.experienceValue, { color: textColor }]}
                    >
                      {applicant.experience_years} years
                    </ThemedText>
                  </View>
                )}

                {applicant?.education && (
                  <View style={styles.experienceItem}>
                    <ThemedText
                      style={[
                        styles.experienceLabel,
                        { color: mutedTextColor },
                      ]}
                    >
                      Education
                    </ThemedText>
                    <ThemedText
                      style={[styles.experienceValue, { color: textColor }]}
                    >
                      {applicant.education}
                    </ThemedText>
                  </View>
                )}

                {applicant?.skills && applicant.skills.length > 0 && (
                  <View style={styles.skillsSection}>
                    <ThemedText
                      style={[styles.skillsLabel, { color: mutedTextColor }]}
                    >
                      Skills
                    </ThemedText>
                    <View style={styles.skillsContainer}>
                      {applicant.skills.map((skill: string, index: number) => (
                        <View
                          key={index}
                          style={[
                            styles.skillTag,
                            { backgroundColor: `${tintColor}20` },
                          ]}
                        >
                          <ThemedText
                            style={[styles.skillText, { color: tintColor }]}
                          >
                            {skill}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Application Content */}
        {(application.cover_letter || application.resume_url) && (
          <View style={styles.section}>
            <View style={styles.applicationCard}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Application
              </ThemedText>

              {application.cover_letter && (
                <View style={styles.coverLetterSection}>
                  <ThemedText
                    style={[styles.coverLetterLabel, { color: mutedTextColor }]}
                  >
                    Cover Letter
                  </ThemedText>
                  <View style={[styles.coverLetterContainer, { borderColor }]}>
                    <ThemedText
                      style={[styles.coverLetterText, { color: textColor }]}
                    >
                      {application.cover_letter}
                    </ThemedText>
                  </View>
                </View>
              )}

              {application.resume_url && (
                <View style={styles.resumeSection}>
                  <TouchableOpacity
                    style={[styles.resumeButton, { borderColor }]}
                  >
                    <Feather name="file-text" size={20} color={tintColor} />
                    <ThemedText
                      style={[styles.resumeText, { color: tintColor }]}
                    >
                      View Resume
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Application Status & Actions */}
        <View style={styles.section}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${getStatusColor(
                        application.status
                      )}20`,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: getStatusColor(application.status) },
                    ]}
                  >
                    {getStatusText(application.status)}
                  </ThemedText>
                </View>

                <ThemedText
                  style={[styles.applicationDate, { color: mutedTextColor }]}
                >
                  Applied{" "}
                  {new Date(application.created_at).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {application.status === ApplicationStatus.Pending && (
                <>
                  <ThemedButton
                    title="Review"
                    onPress={() =>
                      handleApplicationStatusUpdate(
                        application.id,
                        ApplicationStatus.Reviewed
                      )
                    }
                    style={{ backgroundColor: Colors.primary }}
                    textStyle={{ color: Colors.white }}
                  />
                  <ThemedButton
                    title="Accept"
                    onPress={() =>
                      handleApplicationStatusUpdate(
                        application.id,
                        ApplicationStatus.Accepted
                      )
                    }
                    style={{ backgroundColor: Colors.success }}
                    textStyle={{ color: Colors.white }}
                  />
                  <ThemedButton
                    title="Reject"
                    onPress={() =>
                      handleApplicationStatusUpdate(
                        application.id,
                        ApplicationStatus.Rejected
                      )
                    }
                    style={{ backgroundColor: Colors.error }}
                    textStyle={{ color: Colors.white }}
                  />
                </>
              )}

              {application.status === ApplicationStatus.Reviewed && (
                <>
                  <ThemedButton
                    title="Accept"
                    onPress={() =>
                      handleApplicationStatusUpdate(
                        application.id,
                        ApplicationStatus.Accepted
                      )
                    }
                    style={{ backgroundColor: Colors.success }}
                    textStyle={{ color: Colors.white }}
                  />
                  <ThemedButton
                    title="Reject"
                    onPress={() =>
                      handleApplicationStatusUpdate(
                        application.id,
                        ApplicationStatus.Rejected
                      )
                    }
                    style={{ backgroundColor: Colors.error }}
                    textStyle={{ color: Colors.white }}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: Typography.base,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.base,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  backButtonAction: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },

  // Main content
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },

  // Company Card
  companyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  companyName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  companyTagline: {
    fontSize: Typography.sm,
  },

  // Position Card
  positionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  positionTitle: {
    fontSize: Typography["2xl"],
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
  },
  positionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  descriptionContainer: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  descriptionText: {
    fontSize: Typography.base,
    lineHeight: Typography.lineHeight.relaxed,
  },

  // Applicant Card
  applicantCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  applicantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  userAvatarContainer: {
    position: "relative",
    marginRight: Spacing.lg,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: BorderRadius.sm,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: Typography["2xl"],
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  professionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    alignSelf: "flex-start",
    gap: Spacing.xs,
  },
  professionText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  applicantUsername: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  bioContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  userBio: {
    fontSize: Typography.sm,
    fontStyle: "italic",
    lineHeight: Typography.lineHeight.snug,
    flex: 1,
  },

  // Contact Section
  contactSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.sm,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  contactText: {
    fontSize: Typography.base,
  },

  // Experience Section
  experienceSection: {
    gap: Spacing.md,
  },
  experienceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  experienceLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  experienceValue: {
    fontSize: Typography.sm,
  },

  // Skills Section
  skillsSection: {
    gap: Spacing.sm,
  },
  skillsLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  skillTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },

  // Application Card
  applicationCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },

  // Cover Letter
  coverLetterSection: {
    marginBottom: Spacing.md,
  },
  coverLetterLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
  },
  coverLetterContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.gray50,
  },
  coverLetterText: {
    fontSize: Typography.base,
    lineHeight: Typography.lineHeight.relaxed,
  },

  // Resume
  resumeSection: {
    marginTop: Spacing.md,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  resumeText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },

  // Status Card
  statusCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statusHeader: {
    marginBottom: Spacing.lg,
  },
  statusInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  applicationDate: {
    fontSize: Typography.sm,
  },

  // Action Buttons
  actionButtons: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
