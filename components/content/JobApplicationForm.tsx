import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Document, DocumentType, Post } from '@/types';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View, Animated } from 'react-native';
import { ThemedInput } from '../ThemedInput';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import DocumentCard from './DocumentCard';
import DocumentManager from './DocumentManager';

type JobApplicationFormProps = {
  jobPost: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type Step = {
  id: number;
  title: string;
};

export default function JobApplicationForm({
  jobPost,
  onSuccess,
  onCancel,
}: JobApplicationFormProps) {
  const { user } = useAuth();
  const { addApplication } = useApplications();
  const { documents, loading: documentsLoading, fetchDocuments } = useDocuments(user?.id);
  
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResume, setSelectedResume] = useState<Document | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = '#3b82f6'; // Use a fixed color since 'primary' is not in the theme
  
  const steps: Step[] = [
    { id: 1, title: 'Resume Selection' },
    { id: 2, title: 'Cover Letter' },
    { id: 3, title: 'Review & Submit' }
  ];

  useEffect(() => {
    if (user?.id) {
      fetchDocuments(DocumentType.CV);
    }
  }, [fetchDocuments, user?.id]);
  
  useEffect(() => {
    // Update progress when step changes
    const newProgress = (currentStep - 1) / (steps.length - 1);
    setFormProgress(newProgress);
    
    Animated.timing(progressAnimation, {
      toValue: newProgress,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [currentStep, progressAnimation, steps.length]);

  const handleSelectResume = (document: Document) => {
    setSelectedResume(document);
    setShowDocumentPicker(false);
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedResume) {
      Alert.alert('Error', 'Please select a resume to continue');
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to apply');
      return;
    }
    
    if (!selectedResume) {
      Alert.alert('Error', 'Please select a resume');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await addApplication({
        user_id: user.id,
        post_id: jobPost.id,
        resume_id: selectedResume.id,
        resume_url: selectedResume.file_url,
        cover_letter: coverLetter.trim() || null,
      });
      
      if (error) {
        throw error;
      }
      
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Application Submitted',
        'Your application has been successfully submitted.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicatorsContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <Pressable 
              style={[
                styles.stepIndicator,
                currentStep >= step.id && styles.activeStepIndicator,
                { borderColor: currentStep >= step.id ? primaryColor : borderColor }
              ]}
              onPress={() => {
                // Only allow going back to previous steps
                if (step.id < currentStep) {
                  setCurrentStep(step.id);
                  if (process.env.EXPO_OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }
              }}
            >
              <ThemedText 
                style={[
                  styles.stepNumber,
                  currentStep >= step.id && { color: primaryColor }
                ]}
              >
                {step.id}
              </ThemedText>
            </Pressable>
            
            {index < steps.length - 1 && (
              <View style={styles.stepConnector}>
                <Animated.View 
                  style={[
                    styles.stepConnectorFill,
                    { 
                      width: progressAnimation.interpolate({
                        inputRange: [index / (steps.length - 1), (index + 1) / (steps.length - 1)],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp'
                      }),
                      backgroundColor: primaryColor 
                    }
                  ]}
                />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    if (showDocumentPicker) {
      return (
        <ThemedView style={styles.documentPickerContainer}>
          <View style={styles.documentPickerHeader}>
            <ThemedText style={styles.documentPickerTitle}>
              Select a Resume
            </ThemedText>
            <Pressable 
              style={styles.closeButton}
              onPress={() => setShowDocumentPicker(false)}
            >
              <Feather name="x" size={18} color={textColor} />
            </Pressable>
          </View>
          
          <DocumentManager 
            userId={user?.id}
            documentType={DocumentType.CV}
            selectable
            onSelect={handleSelectResume}
          />
        </ThemedView>
      );
    }
    
    switch (currentStep) {
      case 1: // Resume Selection
        return (
          <ThemedView style={styles.formSection}>
            <ThemedText style={styles.stepTitle}>{steps[0].title}</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Select or upload your resume for this application.
            </ThemedText>
            
            {selectedResume ? (
              <View style={styles.selectedResumeContainer}>
                <DocumentCard document={selectedResume} />
                <Pressable
                  style={styles.changeResumeButton}
                  onPress={() => setShowDocumentPicker(true)}
                >
                  <ThemedText style={styles.changeResumeText}>Change Resume</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.selectResumeButton, { borderColor }]}
                onPress={() => setShowDocumentPicker(true)}
                disabled={loading || documentsLoading}
              >
                {documentsLoading ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <>
                    <Feather name="file-text" size={18} color={textColor} />
                    <ThemedText style={styles.selectResumeText}>
                      Select Resume
                    </ThemedText>
                  </>
                )}
              </Pressable>
            )}
          </ThemedView>
        );
        
      case 2: // Cover Letter
        return (
          <ThemedView style={styles.formSection}>
            <ThemedText style={styles.stepTitle}>{steps[1].title}</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Add a cover letter to highlight your qualifications (optional).
            </ThemedText>
            
            <ThemedInput
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Tell us why you're a good fit for this position..."
              multiline
              numberOfLines={8}
              style={styles.coverLetterInput}
            />
          </ThemedView>
        );
        
      case 3: // Review & Submit
        return (
          <ThemedView style={styles.formSection}>
            <ThemedText style={styles.stepTitle}>{steps[2].title}</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Review your application details before submitting.
            </ThemedText>
            
            <ThemedView style={styles.reviewSection}>
              <ThemedText style={styles.reviewSectionTitle}>Position</ThemedText>
              <ThemedText style={styles.reviewSectionContent}>{jobPost.title}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.reviewSection}>
              <ThemedText style={styles.reviewSectionTitle}>Resume</ThemedText>
              {selectedResume && (
                <DocumentCard document={selectedResume} showMenu={false} />
              )}
            </ThemedView>
            
            <ThemedView style={styles.reviewSection}>
              <ThemedText style={styles.reviewSectionTitle}>Cover Letter</ThemedText>
              {coverLetter ? (
                <ThemedView style={styles.coverLetterPreview}>
                  <ThemedText>{coverLetter}</ThemedText>
                </ThemedView>
              ) : (
                <ThemedText style={styles.noContentText}>No cover letter provided</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        );
        
      default:
        return null;
    }
  };
  
  // Render navigation buttons
  const renderNavigationButtons = () => {
    return (
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <Pressable
            style={[styles.navButton, styles.backButton, { borderColor }]}
            onPress={handlePreviousStep}
            disabled={loading}
          >
            <Feather name="chevron-left" size={18} color={textColor} />
            <ThemedText>Back</ThemedText>
          </Pressable>
        )}
        
        {currentStep < steps.length ? (
          <Pressable
            style={[
              styles.navButton, 
              styles.nextButton,
              { 
                backgroundColor: primaryColor,
                opacity: (currentStep === 1 && !selectedResume) ? 0.7 : 1
              }
            ]}
            onPress={handleNextStep}
            disabled={(currentStep === 1 && !selectedResume) || loading}
          >
            <ThemedText style={styles.nextButtonText}>Next</ThemedText>
            <Feather name="chevron-right" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.navButton, 
              styles.submitButton,
              { backgroundColor: primaryColor }
            ]}
            onPress={handleSubmit}
            disabled={loading || !selectedResume}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <ThemedText style={styles.submitButtonText}>Submit Application</ThemedText>
                <Feather name="check" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedText style={styles.title} type="defaultSemiBold">
        Apply for: {jobPost.title}
      </ThemedText>
      
      {renderStepIndicators()}
      
      {renderStepContent()}
      
      {!showDocumentPicker && (
         <View style={styles.actionButtons}>
           <Pressable
             style={[styles.cancelButton, { borderColor }]}
             onPress={onCancel}
             disabled={loading}
           >
             <ThemedText>Cancel</ThemedText>
           </Pressable>
           
           {renderNavigationButtons()}
         </View>
       )}
     </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  // Step indicators
  stepIndicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeStepIndicator: {
    backgroundColor: 'transparent',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  stepConnectorFill: {
    height: '100%',
  },
  // Step content
  formSection: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  selectResumeText: {
    fontSize: 16,
  },
  selectedResumeContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  changeResumeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  changeResumeText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  coverLetterInput: {
    width: '100%',
    minHeight: 160,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  // Review section
  reviewSection: {
    marginBottom: 20,
    gap: 8,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSectionContent: {
    fontSize: 15,
  },
  coverLetterPreview: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noContentText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  // Navigation
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  navigationButtons: {
    flex: 2,
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButton: {
    borderWidth: 1,
  },
  nextButton: {
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Document picker
  documentPickerContainer: {
    flex: 1,
    minHeight: 400,
  },
  documentPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  documentPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
});