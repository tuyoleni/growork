import React from 'react';
import { openGlobalSheet } from '@/utils/globalSheet';
import PostForm from './post/PostForm';

interface CreatePostSheetUIProps {
  onSuccess?: () => void;
}

export default function CreatePostSheetUI({ onSuccess }: CreatePostSheetUIProps) {
  const handleSuccess = () => {
    openGlobalSheet({ snapPoints: ['1%'], children: <></> });
    onSuccess?.();
  };

  return (
    <PostForm onSuccess={handleSuccess} />
  );
}
