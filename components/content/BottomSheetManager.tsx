import React, { useCallback } from 'react';
import { openGlobalSheet } from '@/utils/globalSheet';
import { ThemedText } from '@/components/ThemedText';
import Comments from '@/components/content/Comment';
import CreatePostSheetUI from '@/components/content/CreatePost';
import DocumentManager from '@/components/content/DocumentManager';
import { DocumentType } from '@/types';

interface BottomSheetManagerProps {
  onPostSuccess?: () => void;
}

export function useBottomSheetManager(props?: BottomSheetManagerProps) {
  const { onPostSuccess } = props || {};

  const openCommentSheet = useCallback((postId: string) => {
    openGlobalSheet({
      header: <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Comments</ThemedText>,
      body: <Comments postId={postId} />,
      snapPoints: ['80%'],
    });
  }, []);

  const openCreatePostSheet = useCallback(() => {
    openGlobalSheet({
      header: <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Create Post</ThemedText>,
      body: <CreatePostSheetUI onSuccess={onPostSuccess} />,
      snapPoints: ['90%'],
    });
  }, [onPostSuccess]);

  const openDocumentsSheet = useCallback((userId?: string, documentType?: DocumentType) => {
    openGlobalSheet({
      header: <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Documents</ThemedText>,
      body: <DocumentManager userId={userId} documentType={documentType} />,
      snapPoints: ['80%'],
    });
  }, []);

  return {
    openCommentSheet,
    openCreatePostSheet,
    openDocumentsSheet
  };
}

export default function BottomSheetManager({ onPostSuccess }: BottomSheetManagerProps) {
  return null; // This is a headless component that provides hooks
}