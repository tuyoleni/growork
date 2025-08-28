import React, { useEffect, useRef, useState } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { ThemedInput } from "@/components/ThemedInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Post, Document, DocumentType } from "@/types";
import {
  useAuth,
  useApplications,
  useDocuments,
  useApplicationNotifications,
} from "@/hooks";
import {
  JobApplicationSkeleton,
  CoverLetterSkeleton,
} from "@/components/ui/Skeleton";

import DocumentCard from "./DocumentCard";
import DocumentManager from "./DocumentManager";
import * as Haptics from "expo-haptics";
import { useFlashToast } from "@/components/ui/Flash";

export enum ApplicationStep {
  CVSelection = 0,
  CoverLetter = 1,
  Review = 2,
}

interface JobApplicationFormProps {
  jobPost: Post;
  onSuccess?: () => void;
  style?: any;
}

export default function JobApplicationForm({
  jobPost,
  onSuccess,
}: JobApplicationFormProps) {
  const toast = useFlashToast();
  const { user, profile } = useAuth();
  const { addApplication, checkIfApplied } = useApplications();
  const { fetchDocuments, loading: documentsLoading } = useDocuments(user?.id);
  const { notifyNewApplication } = useApplicationNotifications();

  const [currentStep, setCurrentStep] = useState<ApplicationStep>(
    ApplicationStep.CVSelection
  );
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedResume, setSelectedResume] = useState<Document | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] =
    useState<Document | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasFetchedDocuments = useRef(false);

  useEffect(() => {
    const checkApplication = async () => {
      if (user?.id && !hasFetchedDocuments.current) {
        hasFetchedDocuments.current = true;

        try {
          const { hasApplied: appliedStatus } = await checkIfApplied(
            user.id,
            jobPost.id
          );
          if (appliedStatus) {
            setHasApplied(true);
          }
          await fetchDocuments(DocumentType.CV);
          await fetchDocuments(DocumentType.CoverLetter);
        } catch (error) {
          // Silently handle errors in production
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkApplication();
  }, [user?.id, jobPost.id, checkIfApplied, fetchDocuments]);

  // Animate progress
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const handleSelectResume = (document: Document) => {
    setSelectedResume(document);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectCoverLetter = (document: Document) => {
    setSelectedCoverLetter(document);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextStep = () => {
    if (currentStep === ApplicationStep.CVSelection) {
      if (!selectedResume) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show({
          type: "danger",
          title: "Missing CV",
          message: "Please select a CV to continue.",
        });
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep(ApplicationStep.CoverLetter);
    } else if (currentStep === ApplicationStep.CoverLetter) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep(ApplicationStep.Review);
    } else if (currentStep === ApplicationStep.Review) {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === ApplicationStep.CoverLetter) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(ApplicationStep.CVSelection);
    } else if (currentStep === ApplicationStep.Review) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(ApplicationStep.CoverLetter);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedResume) return;
    setLoading(true);
    try {
      const { error } = await addApplication({
        user_id: user.id,
        post_id: jobPost.id,
        resume_id: selectedResume.id,
        resume_url: selectedResume.file_url,
        cover_letter: coverLetter.trim() || null,
        cover_letter_id: selectedCoverLetter?.id || null,
      });
      if (error) throw error;

      // Send notification to job poster
      if (profile && jobPost.user_id && jobPost.user_id !== user.id) {
        const applicantName =
          profile.name && profile.surname
            ? `${profile.name} ${profile.surname}`
            : profile.username || "Someone";

        await notifyNewApplication(
          jobPost.id, // Using post ID as application ID for now
          jobPost.user_id,
          applicantName,
          jobPost.title || "your job"
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasApplied(true);
    } catch (error: any) {
      // Handle duplicate application error specifically
      if (
        error?.code === "23505" &&
        error?.message?.includes("applications_user_id_post_id_key")
      ) {
        setHasApplied(true);
        toast.show({
          type: "info",
          title: "Already Applied",
          message: "You have already applied to this position.",
        });
      } else {
        toast.show({
          type: "danger",
          title: "Error",
          message: "Failed to submit application. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    // Show applied status if user has already applied
    if (hasApplied) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "#10b981",
              borderRadius: 50,
              width: 80,
              height: 80,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <ThemedText style={{ color: "#fff", fontSize: 24 }}>✓</ThemedText>
          </View>
          <ThemedText
            type="title"
            style={{ marginBottom: 8, textAlign: "center" }}
          >
            Application Submitted
          </ThemedText>
          <ThemedText
            style={{ textAlign: "center", opacity: 0.7, marginBottom: 20 }}
          >
            You have already applied to this position. You can track your
            application progress in the Applications tab or check your email for
            updates from the employer.
          </ThemedText>
          <TouchableOpacity
            style={{
              backgroundColor: "#10b981",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => onSuccess?.()}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Close
            </ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    switch (currentStep) {
      case ApplicationStep.CVSelection:
        if (documentsLoading) {
          return <JobApplicationSkeleton />;
        }
        return (
          <>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
              Select Your CV
            </ThemedText>
            <DocumentManager
              userId={user?.id}
              documentType={DocumentType.CV}
              selectable
              onSelect={handleSelectResume}
              disableScrolling={true}
            />
          </>
        );
      case ApplicationStep.CoverLetter:
        if (documentsLoading) {
          return <CoverLetterSkeleton />;
        }
        return (
          <>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
              Cover Letter (Optional)
            </ThemedText>

            <ThemedText
              style={{ marginBottom: 12, fontSize: 14, opacity: 0.7 }}
            >
              Write a cover letter or upload an existing one
            </ThemedText>

            <ThemedInput
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Tell us why you're a good fit for this position..."
              multiline
              numberOfLines={6}
              style={{
                width: "100%",
                minHeight: 120,
                textAlignVertical: "top",
                paddingTop: 12,
                marginBottom: 16,
              }}
            />

            <ThemedText
              style={{ marginBottom: 8, fontSize: 14, fontWeight: "600" }}
            >
              Or upload a cover letter document:
            </ThemedText>

            <DocumentManager
              userId={user?.id}
              documentType={DocumentType.CoverLetter}
              selectable
              onSelect={handleSelectCoverLetter}
              disableScrolling={true}
            />
          </>
        );
      case ApplicationStep.Review:
        return (
          <View style={{ padding: 16 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
              Review Your Application
            </ThemedText>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: "600", marginBottom: 4 }}>
                Position:
              </ThemedText>
              <ThemedText>{jobPost.title}</ThemedText>
            </View>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: "600", marginBottom: 4 }}>
                CV:
              </ThemedText>
              {selectedResume && (
                <DocumentCard document={selectedResume} showMenu={false} />
              )}
            </View>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: "600", marginBottom: 4 }}>
                Cover Letter:
              </ThemedText>
              {coverLetter ? (
                <ThemedView
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    marginBottom: 8,
                  }}
                >
                  <ThemedText>{coverLetter}</ThemedText>
                </ThemedView>
              ) : selectedCoverLetter ? (
                <DocumentCard document={selectedCoverLetter} showMenu={false} />
              ) : (
                <ThemedText style={{ fontStyle: "italic", opacity: 0.6 }}>
                  No cover letter provided
                </ThemedText>
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Show loading while checking application status
  if (isChecking) {
    return <JobApplicationSkeleton />;
  }

  // Show applied status immediately if user has already applied
  if (hasApplied) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <View
          style={{
            backgroundColor: "#10b981",
            borderRadius: 50,
            width: 80,
            height: 80,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <ThemedText style={{ color: "#fff", fontSize: 24 }}>✓</ThemedText>
        </View>
        <ThemedText
          type="title"
          style={{ marginBottom: 8, textAlign: "center" }}
        >
          Application Submitted
        </ThemedText>
        <ThemedText style={{ textAlign: "center", opacity: 0.7 }}>
          You have already applied to this position. You can track your
          application progress in the Applications tab or check your email for
          updates from the employer.
        </ThemedText>
      </View>
    );
  }

  const atFirstStep = currentStep === ApplicationStep.CVSelection;
  const atLastStep = currentStep === ApplicationStep.Review;

  return (
    <>
      {renderStepContent()}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={atFirstStep ? undefined : handlePrevStep}
          disabled={atFirstStep}
          style={{ opacity: atFirstStep ? 0.5 : 1 }}
        >
          <ThemedText style={{ color: atFirstStep ? "#999" : "#007AFF" }}>
            {atFirstStep ? "Previous" : "← Previous"}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextStep}
          disabled={
            loading ||
            (currentStep === ApplicationStep.CVSelection && !selectedResume)
          }
          style={{
            opacity:
              loading ||
              (currentStep === ApplicationStep.CVSelection && !selectedResume)
                ? 0.5
                : 1,
          }}
        >
          <ThemedText
            style={{
              color:
                loading ||
                (currentStep === ApplicationStep.CVSelection && !selectedResume)
                  ? "#999"
                  : "#007AFF",
            }}
          >
            {atLastStep ? (loading ? "Submitting..." : "Submit") : "Next →"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
}
