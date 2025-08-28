import React from 'react';
import { openGlobalSheet } from '@/utils/globalSheet';
import PostForm from './post/PostForm';

interface CreatePostSheetUIProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreatePostSheetUI({ onSuccess, onCancel }: CreatePostSheetUIProps) {
  const handleSuccess = () => {
    openGlobalSheet({ snapPoints: ['1%'], children: <></> });
    onSuccess?.();
  };

  const handleCancel = () => {
    openGlobalSheet({ snapPoints: ['1%'], children: <></> });
    onCancel?.();
  };

  return (
    <PostForm onSuccess={handleSuccess} onCancel={handleCancel} />
  );
}
