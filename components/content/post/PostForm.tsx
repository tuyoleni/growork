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
import { ImagePickerField } from './ImagePickerField';
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
    imageUrl,
    handleImageSelected,
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
            <ImagePickerField
              selectedImage={imageUrl}
              onImageSelected={handleImageSelected}
              label="Add Image"
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
        return (
          <View style={{ padding: 16 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Review Your Post</ThemedText>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Title:</ThemedText>
              <ThemedText>{title}</ThemedText>
            </View>

            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Content:</ThemedText>
              <ThemedText>{content}</ThemedText>
            </View>

            {imageUrl && (
              <View style={{ marginBottom: 12 }}>
                <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Image:</ThemedText>
                <ThemedText style={{ color: '#666' }}>Image attached</ThemedText>
              </View>
            )}

            {postType === PostType.Job && (
              <View style={{ marginBottom: 12 }}>
                <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Job Details:</ThemedText>
                <ThemedText>Company: {jobFields.company || 'Not specified'}</ThemedText>
                <ThemedText>Location: {jobFields.location || 'Not specified'}</ThemedText>
                <ThemedText>Salary: {jobFields.salary || 'Not specified'}</ThemedText>
                <ThemedText>Job Type: {jobFields.jobType || 'Not specified'}</ThemedText>
                <ThemedText>Industry: {jobFields.industry || 'Not specified'}</ThemedText>
              </View>
            )}

            {postType === PostType.News && (
              <View style={{ marginBottom: 12 }}>
                <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>Article Details:</ThemedText>
                <ThemedText>Industry: {articleFields.industry || 'Not specified'}</ThemedText>
                <ThemedText>Source: {articleFields.source || 'Not specified'}</ThemedText>
              </View>
            )}
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
          disabled={loading || !isFormValid()}
          style={{ opacity: (loading || !isFormValid()) ? 0.5 : 1 }}
        >
          <ThemedText style={{ color: (loading || !isFormValid()) ? '#999' : '#007AFF' }}>
            {atLastStep ? 'Post' : 'Next →'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
}
