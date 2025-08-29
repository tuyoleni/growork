import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Clipboard,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ApplicationStatus } from "@/types/enums";
import ScreenContainer from "@/components/ScreenContainer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import ThemedButton from "@/components/ui/ThemedButton";
import PostBadge from "@/components/content/post/PostBadge";
import UniversalHeader from "@/components/ui/UniversalHeader";
import { ApplicationDetailSkeleton } from "@/components/ui/Skeleton";
import { useThemeColor, useAuth } from "@/hooks";
import { supabase } from "@/utils/supabase";
import { generateStatusUpdateEmail } from "@/utils/emailService";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/DesignSystem";

interface Document {
  id: string;
  type: "cv" | "cover_letter" | "certificate" | "other";
  name: string | null;
  file_url: string;
  uploaded_at: string;
}

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
  documents: Document[];
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
    owner_email?: string;
  } | null;
}

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, "text");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const tintColor = useThemeColor({}, "tint");

  const handleCopyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied!", `${label} copied to clipboard`);
  };

  const handleOpenDocument = (url: string, documentType: string) => {
    if (!url) {
      Alert.alert("Error", `${documentType} not available`);
      return;
    }

    Linking.openURL(url).catch((err) => {
      Alert.alert("Error", `Could not open ${documentType.toLowerCase()}`);
    });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "cv":
        return "file-text";
      case "cover_letter":
        return "file-text";
      case "certificate":
        return "award";
      case "other":
        return "file";
      default:
        return "file";
    }
  };

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
            .select(
              `
              id, 
              name, 
              logo_url,
              user_id
            `
            )
            .eq("id", applicationData.posts.criteria.companyId)
            .single();

          if (!companyError && company) {
            // Use the current user's email as the HR email
            console.log("Company found:", company);
            console.log("Current user:", user);

            companyData = {
              ...company,
              owner_email: user?.email || null,
            };
          }
        }

        // Fetch all documents uploaded for this specific application
        const { data: documentsData, error: documentsError } = await supabase
          .from("documents")
          .select("id, type, name, file_url, uploaded_at")
          .eq("user_id", applicationData.user_id)
          .gte("uploaded_at", applicationData.created_at)
          .order("uploaded_at", { ascending: false });

        if (documentsError) {
          console.error("Documents query error:", documentsError);
        }

        const documents = documentsData || [];

        // Combine data
        const applicationWithDetails: ApplicationData = {
          ...applicationData,
          documents,
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

              // Send email notification when status is changed to "Reviewed"
              if (newStatus === ApplicationStatus.Reviewed && application) {
                try {
                  // Generate email HTML for HR notification
                  const emailHTML = generateStatusUpdateEmail(
                    application,
                    newStatus
                  );

                  // Send email to company HR if email is available
                  console.log("Company data:", application.companies);
                  console.log(
                    "Owner email:",
                    application.companies?.owner_email
                  );

                  if (application.companies?.owner_email) {
                    console.log(
                      "Attempting to send email to:",
                      application.companies.owner_email
                    );
                    console.log("Email HTML length:", emailHTML.length);

                    const emailResponse = await fetch(
                      "https://gkjtpxzmbvispwmfgzrc.supabase.co/functions/v1/send-email",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_KEY}`,
                        },
                        body: JSON.stringify({
                          to: application.companies.owner_email,
                          subject: `New Application Review - ${
                            application.posts?.title || "Job Position"
                          }`,
                          html: emailHTML,
                        }),
                      }
                    );

                    console.log("Email response status:", emailResponse.status);

                    const emailResult = await emailResponse.json();
                    console.log("Email result:", emailResult);

                    if (emailResult.success) {
                      Alert.alert(
                        "Status Updated",
                        `Application status updated to ${newStatus}. Email sent to HR.`
                      );
                    } else {
                      console.error("Email sending failed:", emailResult.error);
                      Alert.alert(
                        "Status Updated",
                        `Application status updated to ${newStatus}. Email sending failed.`
                      );
                    }
                  } else {
                    Alert.alert(
                      "Status Updated",
                      `Application status updated to ${newStatus}. No HR email available.`
                    );
                  }
                } catch (emailError) {
                  console.error("Error sending email:", emailError);
                  Alert.alert(
                    "Success",
                    "Application status updated successfully"
                  );
                }
              } else {
                Alert.alert(
                  "Success",
                  "Application status updated successfully"
                );
              }
            } catch {
              Alert.alert("Error", "Failed to update application status");
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status: ApplicationStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <UniversalHeader
          title="Application Details"
          showBackButton={true}
          showNotifications={false}
        />
        <ApplicationDetailSkeleton />
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
      <UniversalHeader
        title={
          company?.name
            ? `${company.name} - Application`
            : "Application Details"
        }
        showBackButton={true}
        showNotifications={false}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Context */}
        {company && (
          <View style={styles.section}>
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
                <ThemedText style={styles.companyName}>
                  {company.name}
                </ThemedText>
                <ThemedText style={styles.companyTagline}>
                  Hiring for {post?.title || "Position"}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Job Position */}
        <View style={styles.section}>
          <ThemedText style={styles.positionTitle}>
            {post?.title || "Job Position"}
          </ThemedText>

          <View style={styles.positionDetails}>
            {post?.type && (
              <PostBadge
                label={post.type}
                icon="briefcase"
                variant="default"
                size="small"
              />
            )}

            {post?.industry && (
              <PostBadge
                label={post.industry}
                icon="briefcase"
                variant="default"
                size="small"
              />
            )}

            {post?.criteria?.location && (
              <PostBadge
                label={post.criteria.location}
                icon="map-pin"
                variant="default"
                size="small"
              />
            )}
          </View>

          {post?.content && (
            <View style={styles.descriptionContainer}>
              <ThemedText style={styles.descriptionText}>
                {post.content}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Applicant Profile */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Meet the Applicant
          </ThemedText>
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
              <ThemedText style={[styles.applicantName, { color: textColor }]}>
                {applicant?.name && applicant?.surname
                  ? `${applicant.name} ${applicant.surname}`
                  : applicant?.username || "Anonymous Applicant"}
              </ThemedText>

              {applicant?.profession && (
                <PostBadge
                  label={applicant.profession}
                  icon="briefcase"
                  variant="highlighted"
                  size="small"
                />
              )}

              <View style={styles.usernameRow}>
                <Feather name="user" size={14} color={mutedTextColor} />
                <ThemedText style={styles.applicantUsername}>
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
                  <ThemedText style={styles.userBio} numberOfLines={0}>
                    {applicant.bio}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        {(applicant?.phone || applicant?.website || applicant?.location) && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Contact
            </ThemedText>

            {applicant?.phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() =>
                  handleCopyToClipboard(applicant.phone!, "Phone number")
                }
              >
                <Feather name="phone" size={16} color={tintColor} />
                <ThemedText style={styles.contactText}>
                  {applicant.phone}
                </ThemedText>
              </TouchableOpacity>
            )}

            {applicant?.website && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() =>
                  handleCopyToClipboard(applicant.website!, "Website")
                }
              >
                <Feather name="globe" size={16} color={tintColor} />
                <ThemedText style={styles.contactText}>
                  {applicant.website}
                </ThemedText>
              </TouchableOpacity>
            )}

            {applicant?.location && (
              <View style={styles.contactItem}>
                <Feather name="map-pin" size={16} color={mutedTextColor} />
                <ThemedText style={styles.contactText}>
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
          <View style={styles.section}>
            {applicant?.experience_years && (
              <View style={styles.experienceItem}>
                <ThemedText style={styles.experienceLabel}>
                  Experience
                </ThemedText>
                <ThemedText style={styles.experienceValue}>
                  {applicant.experience_years} years
                </ThemedText>
              </View>
            )}

            {applicant?.education && (
              <View style={styles.experienceItem}>
                <ThemedText style={styles.experienceLabel}>
                  Education
                </ThemedText>
                <ThemedText style={styles.experienceValue}>
                  {applicant.education}
                </ThemedText>
              </View>
            )}

            {applicant?.skills && applicant.skills.length > 0 && (
              <View style={styles.skillsSection}>
                <ThemedText style={styles.skillsLabel}>Skills</ThemedText>
                <View style={styles.skillsContainer}>
                  {applicant.skills.map((skill: string, index: number) => (
                    <PostBadge
                      key={index}
                      label={skill}
                      variant="default"
                      size="small"
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Application Content */}
        {(application.cover_letter || application.resume_url) && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Application
            </ThemedText>

            {application.cover_letter && (
              <View style={styles.coverLetterSection}>
                <ThemedText style={styles.coverLetterLabel}>
                  Cover Letter
                </ThemedText>
                {application.cover_letter.startsWith("http") ? (
                  <TouchableOpacity
                    style={[
                      styles.coverLetterContainer,
                      { borderColor: Colors.gray300 },
                    ]}
                    onPress={() =>
                      handleOpenDocument(
                        application.cover_letter!,
                        "Cover Letter"
                      )
                    }
                  >
                    <Feather
                      name="file-text"
                      size={16}
                      color={tintColor}
                      style={{ marginRight: 8 }}
                    />
                    <ThemedText style={styles.coverLetterText}>
                      View Cover Letter
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.coverLetterContainer,
                      { borderColor: Colors.gray300 },
                    ]}
                  >
                    <ThemedText style={styles.coverLetterText}>
                      {application.cover_letter}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Documents Section */}
            {application.documents && application.documents.length > 0 && (
              <View style={styles.documentsSection}>
                <ThemedText style={styles.sectionTitle}>Documents</ThemedText>
                {application.documents.map((document) => (
                  <TouchableOpacity
                    key={document.id}
                    style={styles.documentCard}
                    onPress={() =>
                      handleOpenDocument(
                        document.file_url,
                        document.name || document.type
                      )
                    }
                  >
                    <View style={styles.documentCardContent}>
                      <View style={styles.documentIconContainer}>
                        <Feather
                          name={getDocumentIcon(document.type)}
                          size={24}
                          color={tintColor}
                        />
                      </View>
                      <View style={styles.documentInfo}>
                        <ThemedText style={styles.documentName}>
                          {document.name ||
                            `${
                              document.type.charAt(0).toUpperCase() +
                              document.type.slice(1)
                            }`}
                        </ThemedText>
                        <ThemedText style={styles.documentType}>
                          {document.type.replace("_", " ").toUpperCase()}
                        </ThemedText>
                      </View>
                      <Feather
                        name="external-link"
                        size={18}
                        color={mutedTextColor}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Fallback for old resume_url if no documents */}
            {(!application.documents || application.documents.length === 0) &&
              application.resume_url && (
                <View style={styles.resumeSection}>
                  <TouchableOpacity
                    style={[
                      styles.resumeButton,
                      { borderColor: Colors.gray300 },
                    ]}
                    onPress={() =>
                      handleOpenDocument(application.resume_url!, "Resume")
                    }
                  >
                    <Feather name="file-text" size={20} color={tintColor} />
                    <ThemedText style={styles.resumeText}>
                      View Resume
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        )}

        {/* Application Status & Actions */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <ThemedText style={styles.statusText}>
                {getStatusText(application.status)}
              </ThemedText>
              <ThemedText style={styles.applicationDate}>
                Applied {new Date(application.created_at).toLocaleDateString()}
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
                  style={{ flex: 1 }}
                />
                <ThemedButton
                  title="Accept"
                  onPress={() =>
                    handleApplicationStatusUpdate(
                      application.id,
                      ApplicationStatus.Accepted
                    )
                  }
                  style={{ flex: 1 }}
                />
                <ThemedButton
                  title="Reject"
                  onPress={() =>
                    handleApplicationStatusUpdate(
                      application.id,
                      ApplicationStatus.Rejected
                    )
                  }
                  style={{ flex: 1 }}
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
                  style={{ flex: 1 }}
                />
                <ThemedButton
                  title="Reject"
                  onPress={() =>
                    handleApplicationStatusUpdate(
                      application.id,
                      ApplicationStatus.Rejected
                    )
                  }
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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

  // Main content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray400,
  },

  // Company Header
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  companyName: {
    marginBottom: Spacing.xs,
  },
  companyTagline: {
    marginBottom: Spacing.xs,
  },
  positionTitle: {
    marginBottom: Spacing.sm,
  },
  positionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },

  descriptionContainer: {
    paddingTop: Spacing.sm,
  },
  descriptionText: {
    marginTop: Spacing.xs,
  },

  // Applicant Header
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
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    marginBottom: Spacing.xs,
  },

  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  applicantUsername: {
    marginLeft: Spacing.xs,
  },
  bioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flex: 1,
  },
  userBio: {
    flex: 1,
    marginLeft: Spacing.xs,
  },

  // Contact Section
  contactSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  contactText: {
    marginLeft: Spacing.sm,
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
    marginRight: Spacing.sm,
  },
  experienceValue: {
    marginLeft: Spacing.sm,
  },

  // Skills Section
  skillsSection: {
    gap: Spacing.sm,
  },
  skillsLabel: {
    marginBottom: Spacing.xs,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },

  // Cover Letter
  coverLetterSection: {
    marginBottom: Spacing.sm,
  },
  coverLetterLabel: {
    marginBottom: Spacing.xs,
  },
  coverLetterContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.gray700,
  },
  coverLetterText: {
    marginTop: Spacing.xs,
  },

  // Documents
  documentsSection: {
    gap: Spacing.md,
  },
  documentCard: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  documentCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray300,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  documentType: {
    color: Colors.gray400,
    fontSize: 12,
  },

  // Resume
  resumeSection: {
    marginTop: Spacing.sm,
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
    marginLeft: Spacing.sm,
  },

  // Status Header
  statusHeader: {
    marginBottom: Spacing.md,
  },
  statusInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  applicationDate: {
    color: Colors.gray400,
    fontSize: Typography.sm,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
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
    marginLeft: Spacing.xs,
  },
});
