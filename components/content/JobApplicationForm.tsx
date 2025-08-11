'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, View, Pressable, ActivityIndicator } from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Post, Document, DocumentType } from '@/types';
import { useAuth } from '@/hooks';
import { useApplications } from '@/hooks';
import { useDocuments } from '@/hooks';
import { useApplicationNotifications } from '@/hooks';
import { useThemeColor } from '@/hooks';
import DocumentCard from './DocumentCard';
import DocumentManager from './DocumentManager';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFlashToast } from '@/components/ui/Flash';

export enum ApplicationStep {
  ResumeSelection = 0,
  CoverLetter = 1,
  Review = 2,
}

interface JobApplicationFormProps {
  jobPost: Post;
  onSuccess?: () => void;
  style?: any;
}

export default function JobApplicationForm({ jobPost, onSuccess }: JobApplicationFormProps) {
  const toast = useFlashToast();
  const { user, profile } = useAuth();
  const { addApplication, checkIfApplied } = useApplications();
  const { loading: documentsLoading, fetchDocuments } = useDocuments(user?.id);
  const { notifyNewApplication } = useApplicationNotifications();

  const [currentStep, setCurrentStep] = useState<ApplicationStep>(ApplicationStep.ResumeSelection);
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResume, setSelectedResume] = useState<Document | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<Document | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [showCoverLetterPicker, setShowCoverLetterPicker] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  // Check if user has already applied and fetch documents on mount
  useEffect(() => {
    const checkApplication = async () => {
      if (user?.id) {
        const { hasApplied } = await checkIfApplied(user.id, jobPost.id);
        if (hasApplied) {
          toast.show({
            type: 'info',
            title: 'Already Applied',
            message: 'You have already applied to this position.'
          });
          onSuccess?.(); // Close the form
          return;
        }

        fetchDocuments(DocumentType.CV);
        fetchDocuments(DocumentType.CoverLetter);
      }
    };

    checkApplication();
  }, [user?.id, jobPost.id, checkIfApplied, fetchDocuments, toast, onSuccess]);

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
    setShowDocumentPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectCoverLetter = (document: Document) => {
    setSelectedCoverLetter(document);
    setShowCoverLetterPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextStep = () => {
    if (currentStep === ApplicationStep.ResumeSelection) {
      if (!selectedResume) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show({ type: 'danger', title: 'Missing Resume', message: 'Please select a resume to continue.' });
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
      setCurrentStep(ApplicationStep.ResumeSelection);
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
        cover_letter_id: selectedCoverLetter?.id || null
      });
      if (error) throw error;

      // Send notification to job poster
      if (profile && jobPost.user_id && jobPost.user_id !== user.id) {
        const applicantName = profile.name && profile.surname
          ? `${profile.name} ${profile.surname}`
          : profile.username || 'Someone';

        await notifyNewApplication(
          jobPost.id, // Using post ID as application ID for now
          jobPost.user_id,
          applicantName,
          jobPost.title || 'your job'
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
    } catch (error: any) {
      // Handle duplicate application error specifically
      if (error?.code === '23505' && error?.message?.includes('applications_user_id_post_id_key')) {
        toast.show({
          type: 'info',
          title: 'Already Applied',
          message: 'You have already applied to this position.'
        });
        onSuccess?.(); // Close the form since they've already applied
      } else {
        toast.show({
          type: 'danger',
          title: 'Error',
          message: 'Failed to submit application. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (showDocumentPicker) {
      return (
        <ThemedView style={{ flex: 1, minHeight: 400 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>Select a Resume</ThemedText>
            <Pressable style={{ padding: 8, borderRadius: 20 }} onPress={() => setShowDocumentPicker(false)}>
              <Feather name="x" size={18} color={textColor} />
            </Pressable>
          </View>
          <DocumentManager
            userId={user?.id}
            documentType={DocumentType.CV}
            selectable
            onSelect={handleSelectResume}
            disableScrolling={true}
          />
        </ThemedView>
      );
    }

    if (showCoverLetterPicker) {
      return (
        <ThemedView style={{ flex: 1, minHeight: 400 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>Select a Cover Letter</ThemedText>
            <Pressable style={{ padding: 8, borderRadius: 20 }} onPress={() => setShowCoverLetterPicker(false)}>
              <Feather name="x" size={18} color={textColor} />
            </Pressable>
          </View>
          <DocumentManager
            userId={user?.id}
            documentType={DocumentType.CoverLetter}
            selectable
            onSelect={handleSelectCoverLetter}
            disableScrolling={true}
          />
        </ThemedView>
      );
    }

    switch (currentStep) {
      case ApplicationStep.ResumeSelection:
        return (
          <>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Select Your Resume</ThemedText>
            {selectedResume ? (
              <View>
                <DocumentCard document={selectedResume} />
                <Pressable onPress={() => setShowDocumentPicker(true)} style={{ alignSelf: 'flex-end', padding: 8 }}>
                  <ThemedText style={{ fontSize: 14, textDecorationLine: 'underline' }}>Change Resume</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderRadius: 8,
                  borderColor
                }}
                onPress={() => setShowDocumentPicker(true)}
                disabled={loading || documentsLoading}
              >
                {documentsLoading ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <>
                    <Feather name="file-text" size={18} color={textColor} />
                    <ThemedText style={{ fontSize: 16 }}>Select Resume</ThemedText>
                  </>
                )}
              </Pressable>
            )}
          </>
        );
      case ApplicationStep.CoverLetter:
        return (
          <>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Cover Letter (Optional)</ThemedText>

            <ThemedText style={{ marginBottom: 12, fontSize: 14, opacity: 0.7 }}>
              Write a cover letter or upload an existing one
            </ThemedText>

            <ThemedInput
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Tell us why you're a good fit for this position..."
              multiline
              numberOfLines={6}
              style={{ width: '100%', minHeight: 120, textAlignVertical: 'top', paddingTop: 12, marginBottom: 16 }}
            />

            <ThemedText style={{ marginBottom: 8, fontSize: 14, fontWeight: '600' }}>Or upload a cover letter document:</ThemedText>

            {selectedCoverLetter ? (
              <View>
                <DocumentCard document={selectedCoverLetter} />
                <Pressable onPress={() => setShowCoverLetterPicker(true)} style={{ alignSelf: 'flex-end', padding: 8 }}>
                  <ThemedText style={{ fontSize: 14, textDecorationLine: 'underline' }}>Change Document</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderRadius: 8,
                  borderColor
                }}
                onPress={() => setShowCoverLetterPicker(true)}
                disabled={loading}
              >
                <Feather name="file-text" size={18} color={textColor} />
                <ThemedText style={{ fontSize: 16 }}>Upload Cover Letter Document</ThemedText>
              </Pressable>
            )}
          </>
        );
      case ApplicationStep.Review:
        return (
          <View style={{ padding: 16 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Review Your Application</ThemedText>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Position:</ThemedText>
              <ThemedText>{jobPost.title}</ThemedText>
            </View>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Resume:</ThemedText>
              {selectedResume && <DocumentCard document={selectedResume} showMenu={false} />}
            </View>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Cover Letter:</ThemedText>
              {coverLetter ? (
                <ThemedView style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 }}>
                  <ThemedText>{coverLetter}</ThemedText>
                </ThemedView>
              ) : selectedCoverLetter ? (
                <DocumentCard document={selectedCoverLetter} showMenu={false} />
              ) : (
                <ThemedText style={{ fontStyle: 'italic', opacity: 0.6 }}>No cover letter provided</ThemedText>
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const atFirstStep = currentStep === 0;
  const atLastStep = currentStep === 2;

  return (
    <>
      {renderStepContent()}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity
          onPress={atFirstStep ? undefined : handlePrevStep}
          disabled={atFirstStep}
          style={{ opacity: atFirstStep ? 0.5 : 1 }}
        >
          <ThemedText style={{ color: atFirstStep ? '#999' : '#007AFF' }}>
            {atFirstStep ? 'Previous' : '← Previous'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextStep}
          disabled={loading || (currentStep === 0 && !selectedResume)}
          style={{ opacity: (loading || (currentStep === 0 && !selectedResume)) ? 0.5 : 1 }}
        >
          <ThemedText style={{ color: (loading || (currentStep === 0 && !selectedResume)) ? '#999' : '#007AFF' }}>
            {atLastStep ? (loading ? 'Submitting...' : 'Submit') : 'Next →'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
} 