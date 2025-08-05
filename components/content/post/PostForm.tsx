'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, TouchableOpacity, View } from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { PostType } from '@/types';
import { usePostForm } from './usePostForm';
import PostTypeSelector from './PostTypeSelector';
import JobFields from './JobFields';
import ArticleFields from './ArticleFields';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useFlashToast } from '@/components/ui/Flash';

export enum WizardStep {
  BasicInfo = 0,
  DetailsInfo = 1,
  Review = 2,
}

interface PostFormProps {
  onSuccess?: () => void;
  style?: any;
}

export default function PostForm({ onSuccess }: PostFormProps) {
  const toast = useFlashToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BasicInfo);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const {
    title,
    setTitle,
    content,
    setContent,
    loading,
    postType,
    handlePostTypeChange,
    jobFields,
    setJobFields,
    articleFields,
    setArticleFields,
    handleSubmit,
    isFormValid,
  } = usePostForm(onSuccess);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const handleNextStep = () => {
    if (currentStep === WizardStep.BasicInfo) {
      if (!title.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show({ type: 'danger', title: 'Missing title', message: 'Please enter a title for your post.' });
        return;
      }
      if (!content.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show({ type: 'danger', title: 'Missing content', message: 'Please enter content for your post.' });
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep(WizardStep.DetailsInfo);
    } else if (currentStep === WizardStep.DetailsInfo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep(WizardStep.Review);
    } else if (currentStep === WizardStep.Review) {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === WizardStep.DetailsInfo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(WizardStep.BasicInfo);
    } else if (currentStep === WizardStep.Review) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(WizardStep.DetailsInfo);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.BasicInfo:
        return (
          <>
            <PostTypeSelector
              selectedPostType={postType}
              onPostTypeChange={handlePostTypeChange}
            />
            <ThemedInput
              placeholder="Enter a title for your post"
              value={title}
              maxLength={80}
              onChangeText={setTitle}
            />
            <ThemedInput
              placeholder="What would you like to share?"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </>
        );
      case WizardStep.DetailsInfo:
        return postType === PostType.Job ? (
          <JobFields
            values={jobFields}
            onChange={setJobFields}
          />
        ) : (
          <ArticleFields
            values={articleFields}
            onChange={setArticleFields}
          />
        );
      case WizardStep.Review:
        return null; // Add review UI if needed
      default:
        return null;
    }
  };

  const atFirstStep = currentStep === 0;
  const atLastStep = currentStep === 2;

  return (
    <>
      {renderStepContent()}
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={atFirstStep ? undefined : handlePrevStep}
          disabled={atFirstStep}
        >
          <ThemedText>Previous</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextStep}
          disabled={loading || !isFormValid()}
        >
          <ThemedText>
            {atLastStep ? 'Post' : 'Next'}
          </ThemedText>
          {!atLastStep && <Feather name="arrow-right" size={18} color="#007AFF" />}
        </TouchableOpacity>
      </View>
    </>
  );
}
