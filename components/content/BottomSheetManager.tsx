import React, { useCallback } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { openGlobalSheet } from '@/utils/globalSheet';
import Comments from '@/components/content/comments/Comment';
import CreatePostSheetUI from '@/components/content/CreatePost';
import DocumentManager from '@/components/content/DocumentManager';
import { useJobApplicationForm } from '@/components/content/useJobApplicationForm';
import { Post, DocumentType } from '@/types';

// --- Optional: Main body for job application sheet ---
interface JobApplicationSheetContentProps {
  post: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
}
const JobApplicationSheetContent: React.FC<JobApplicationSheetContentProps> = ({
  post,
  onSuccess,
  onCancel,
}) => {
  const { body } = useJobApplicationForm({ jobPost: post, onSuccess });
  return body;
};

// --- Props interface for the manager ---
interface BottomSheetManagerProps {
  onPostSuccess?: () => void;
}

// --- Wraps content in KeyboardAvoidingView for keyboard safety in all sheets ---
function withKeyboardAvoidance(children: React.ReactNode) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

// --- The bottom sheet manager / hook itself ---
export function useBottomSheetManager(props?: BottomSheetManagerProps) {
  const { onPostSuccess } = props || {};

  const openCommentSheet = useCallback(
    (postId: string) => {
      openGlobalSheet({
        snapPoints: ['80%'],
        children: withKeyboardAvoidance(<Comments postId={postId} />),
      });
    },
    []
  );

  const openCreatePostSheet = useCallback(
    () => {
      openGlobalSheet({
        snapPoints: ['90%'],
        children: withKeyboardAvoidance(<CreatePostSheetUI onSuccess={onPostSuccess} />),
      });
    },
    [onPostSuccess]
  );

  const openDocumentsSheet = useCallback(
    (userId?: string, documentType?: DocumentType) => {
      openGlobalSheet({
        snapPoints: ['80%'],
        children: withKeyboardAvoidance(<DocumentManager userId={userId} documentType={documentType} />),
      });
    },
    []
  );

  const openJobApplicationSheet = useCallback(
    (
      post: Post,
      callbacks?: { onSuccess?: () => void; onCancel?: () => void },
    ) => {
      openGlobalSheet({
        snapPoints: ['90%'],
        children: withKeyboardAvoidance(
          <JobApplicationSheetContent
            post={post}
            onSuccess={callbacks?.onSuccess}
            onCancel={callbacks?.onCancel}
          />
        ),
      });
    },
    []
  );

  return {
    openCommentSheet,
    openCreatePostSheet,
    openDocumentsSheet,
    openJobApplicationSheet,
  };
}

export default function BottomSheetManager({ onPostSuccess }: BottomSheetManagerProps) {
  return null;
}
