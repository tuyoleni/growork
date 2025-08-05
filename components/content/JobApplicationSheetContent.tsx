import React, { useState } from 'react';
import { View } from 'react-native';
import { Post } from '@/types';
import { useJobApplicationForm } from './useJobApplicationForm';

interface JobApplicationSheetContentProps {
  post: Post;
  onSuccess?: () => void;
}

/**
 * This component is specifically designed to be used inside the GlobalBottomSheet
 * It handles the job application form and avoids nested scrollable views
 */
export default function JobApplicationSheetContent({ 
  post, 
  onSuccess 
}: JobApplicationSheetContentProps) {
  // We directly return the body content to avoid nesting scrollable views
  // The GlobalBottomSheet will wrap this in its own scrollable container
  const { body } = useJobApplicationForm({
    jobPost: post,
    onSuccess,
  });

  return (
    <View style={{ flex: 1 }}>
      {body}
    </View>
  );
}