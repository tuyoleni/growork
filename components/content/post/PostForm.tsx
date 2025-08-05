import React, { useEffect, useState, useRef } from 'react';
import { 
  Keyboard, KeyboardAvoidingView, Platform, 
  StyleSheet, View, ViewStyle, Pressable, Alert,
  ActivityIndicator, Animated, Image
} from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PostType } from '@/types';
import { usePostForm } from './usePostForm';
import PostTypeSelector from './PostTypeSelector';
import JobFields from './JobFields';
import ArticleFields from './ArticleFields';
import ImagePickerField from './ImagePickerField';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Enum for wizard steps
enum WizardStep {
  BasicInfo = 0,
  DetailsInfo = 1,
  Review = 2
}

const STEP_TITLES = {
  [WizardStep.BasicInfo]: 'Basic Information',
  [WizardStep.DetailsInfo]: 'Additional Details',
  [WizardStep.Review]: 'Review & Post'
}

interface PostFormProps {
  onSuccess?: () => void;
  style?: ViewStyle;
}

export default function PostForm({ onSuccess, style }: PostFormProps) {
  const {
    title,
    setTitle,
    content,
    setContent,
    imageUri,
    handleImageSelected,
    loading,
    postType,
    handlePostTypeChange,
    jobFields,
    setJobFields,
    articleFields,
    setArticleFields,
    handleSubmit,
    isFormValid
  } = usePostForm(onSuccess);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BasicInfo);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Theme colors
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  // Keyboard adjust
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardOffset(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOffset(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  
  // Animate progress when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 2, // 3 steps (0, 1, 2) divided by 2 to get values between 0-1
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const handleNextStep = () => {
    if (currentStep === WizardStep.BasicInfo) {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }
      if (!content.trim()) {
        Alert.alert('Error', 'Please enter content');
        return;
      }
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(WizardStep.DetailsInfo);
    } else if (currentStep === WizardStep.DetailsInfo) {
      // Validate details based on post type
      if (postType === PostType.Job) {
        if (!jobFields.company.trim()) {
          Alert.alert('Error', 'Please enter a company name');
          return;
        }
      }
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(WizardStep.Review);
    } else if (currentStep === WizardStep.Review) {
      handleSubmit();
    }
  };

  // Handle previous step in wizard
  const handlePrevStep = () => {
    if (currentStep === WizardStep.DetailsInfo) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(WizardStep.BasicInfo);
    } else if (currentStep === WizardStep.Review) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(WizardStep.DetailsInfo);
    }
  };

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[0, 1, 2].map((step) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const canNavigate = step < currentStep; // Only allow navigation to previous steps
          
          return (
            <Pressable 
              key={step}
              onPress={() => canNavigate && setCurrentStep(step)}
              disabled={!canNavigate}
              style={styles.stepIndicatorWrapper}
            >
              <View style={styles.stepLabelContainer}>
                <ThemedText 
                  style={[styles.stepLabel, isActive && { color: tintColor, fontWeight: '600' }]}
                >
                  {STEP_TITLES[step as WizardStep]}
                </ThemedText>
              </View>
              <View style={styles.stepDotsContainer}>
                <View 
                  style={[
                    styles.stepDot, 
                    { 
                      backgroundColor: isActive || isCompleted ? tintColor : borderColor,
                      width: isActive ? 24 : 8,
                    }
                  ]}
                />
                {step < 2 && (
                  <View 
                    style={[
                      styles.stepConnector,
                      { backgroundColor: borderColor }
                    ]}
                  >
                    <Animated.View 
                      style={[
                        styles.stepProgress,
                        { 
                          backgroundColor: tintColor,
                          width: progressAnim.interpolate({
                            inputRange: [step/2, (step+1)/2],
                            outputRange: ['0%', '100%'],
                            extrapolate: 'clamp'
                          })
                        }
                      ]}
                    />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // Render basic info step
  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      {/* POST TYPE SELECTOR */}
      <PostTypeSelector
        selectedPostType={postType}
        onPostTypeChange={handlePostTypeChange}
      />

      {/* TITLE INPUT */}
      <ThemedInput
        style={styles.titleInput}
        placeholder="Title"
        value={title}
        maxLength={80}
        onChangeText={setTitle}
        autoFocus
      />

      {/* CONTENT INPUT */}
      <ThemedInput
        style={styles.contentInput}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={1200}
        textAlignVertical="top"
      />

      {/* IMAGE PICKER */}
      <ImagePickerField
        imageUri={imageUri}
        onImageSelected={handleImageSelected}
        style={styles.imagePicker}
      />
    </View>
  );

  // Render details step
  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      {/* JOB FIELDS */}
      {postType === PostType.Job && (
        <JobFields 
          values={jobFields}
          onChange={setJobFields}
        />
      )}

      {/* ARTICLE FIELDS */}
      {postType === PostType.News && (
        <ArticleFields 
          values={articleFields}
          onChange={setArticleFields}
        />
      )}
    </View>
  );

  // Render review step
  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.reviewHeader}>
        <Feather name="check-circle" size={24} color={tintColor} />
        <ThemedText style={styles.reviewHeaderText}>Ready to post</ThemedText>
      </View>
      
      <View style={styles.reviewCard}>
        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewTitle}>Post Type</ThemedText>
          <ThemedText style={styles.reviewContent}>{postType === PostType.Job ? 'Job' : 'Article'}</ThemedText>
        </View>
        
        <View style={styles.reviewDivider} />
        
        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewTitle}>Title</ThemedText>
          <ThemedText style={styles.reviewContent}>{title}</ThemedText>
        </View>
        
        <View style={styles.reviewDivider} />
        
        <View style={styles.reviewSection}>
          <ThemedText style={styles.reviewTitle}>Content</ThemedText>
          <ThemedText style={styles.reviewContent} numberOfLines={3}>{content}</ThemedText>
          {content.length > 150 && (
            <ThemedText style={styles.reviewContentTruncated}>...</ThemedText>
          )}
        </View>

        {postType === PostType.Job && (
          <>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewRow}>
              <View style={styles.reviewItem}>
                <Feather name="briefcase" size={16} color={textColor} style={styles.reviewIcon} />
                <ThemedText style={styles.reviewLabel}>Company</ThemedText>
                <ThemedText style={styles.reviewValue}>{jobFields.company}</ThemedText>
              </View>
              
              <View style={styles.reviewItem}>
                <Feather name="map-pin" size={16} color={textColor} style={styles.reviewIcon} />
                <ThemedText style={styles.reviewLabel}>Location</ThemedText>
                <ThemedText style={styles.reviewValue}>{jobFields.location}</ThemedText>
              </View>
            </View>
            
            <View style={styles.reviewRow}>
              <View style={styles.reviewItem}>
                <Feather name="dollar-sign" size={16} color={textColor} style={styles.reviewIcon} />
                <ThemedText style={styles.reviewLabel}>Salary</ThemedText>
                <ThemedText style={styles.reviewValue}>{jobFields.salary}</ThemedText>
              </View>
              
              <View style={styles.reviewItem}>
                <Feather name="clock" size={16} color={textColor} style={styles.reviewIcon} />
                <ThemedText style={styles.reviewLabel}>Job Type</ThemedText>
                <ThemedText style={styles.reviewValue}>{jobFields.jobType}</ThemedText>
              </View>
            </View>
            
            <View style={styles.reviewRow}>
              <View style={styles.reviewItem}>
                <Feather name="tag" size={16} color={textColor} style={styles.reviewIcon} />
                <ThemedText style={styles.reviewLabel}>Industry</ThemedText>
                <ThemedText style={styles.reviewValue}>{jobFields.industry}</ThemedText>
              </View>
            </View>
          </>
        )}

        {postType === PostType.News && (
          <>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewRow}>
              <View style={styles.reviewItem}>
                <Feather name="link" size={16} color={textColor} style={styles.reviewIcon} />
                <ThemedText style={styles.reviewLabel}>Source</ThemedText>
                <ThemedText style={styles.reviewValue}>{articleFields.source}</ThemedText>
              </View>
            </View>
          </>
        )}
      </View>
      
      {imageUri && (
        <View style={styles.reviewImageContainer}>
          <ThemedText style={styles.reviewTitle}>Image</ThemedText>
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          </View>
        </View>
      )}
      
      <ThemedText style={styles.reviewNote}>
        Review your post details above. When you're ready, click "Post" to publish.
      </ThemedText>
    </View>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.BasicInfo:
        return renderBasicInfoStep();
      case WizardStep.DetailsInfo:
        return renderDetailsStep();
      case WizardStep.Review:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Render navigation buttons
  const renderNavigationButtons = () => (
    <View style={styles.actionButtons}>
      {currentStep > WizardStep.BasicInfo ? (
        <Pressable
          style={[styles.backButton, { borderColor }]}
          onPress={handlePrevStep}
          disabled={loading}
        >
          <Feather name="arrow-left" size={18} color={textColor} />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </Pressable>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      
      <Pressable
        style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleNextStep}
        disabled={loading || !isFormValid()}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.submitButtonText}>
            {currentStep === WizardStep.Review ? 'Post' : 'Next'}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? "padding" : undefined}
      keyboardVerticalOffset={16}
    >
      <View style={[styles.container, { paddingBottom: keyboardOffset > 0 ? keyboardOffset - 8 : 16 }, style]}>
        {/* Step Indicators */}
        {renderStepIndicators()}
        
        {/* Current Step Content */}
        {renderStepContent()}
        
        {/* Navigation Buttons */}
        {renderNavigationButtons()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    justifyContent: 'flex-start',
  },
  // Step indicators
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepIndicatorWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepLabelContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  stepConnector: {
    height: 2,
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
  },
  stepProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
  },
  // Step content
  stepContent: {
    flex: 1,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 10,
    borderBottomWidth: 2,
    marginBottom: 12,
  },
  contentInput: {
    minHeight: 100,
    marginBottom: 14,
  },
  imagePicker: {
    marginTop: 8,
    marginBottom: 16,
  },
  // Review step
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  reviewHeaderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSection: {
    marginBottom: 12,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  reviewTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  reviewContentTruncated: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reviewItem: {
    flex: 1,
  },
  reviewIcon: {
    marginBottom: 4,
  },
  reviewLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  reviewValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  reviewNote: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  reviewImageContainer: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  // Navigation buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
  },
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});