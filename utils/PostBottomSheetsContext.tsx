import React, { createContext, useCallback, ReactNode } from 'react';
import { openGlobalSheet } from './globalSheet';
import { ThemedText } from '@/components/ThemedText';
import Comments from '@/components/content/Comment';
import CreatePostSheetUI from '@/components/content/CreatePost';

interface PostBottomSheetsContextType {
  openCommentSheet: (postId: string) => void;
  openCreatePostSheet: () => void;
}

export const PostBottomSheetsContext = createContext<PostBottomSheetsContextType>({
  openCommentSheet: () => {},
  openCreatePostSheet: () => {},
});

interface PostBottomSheetsProviderProps {
  children: ReactNode;
  onPostSuccess?: () => void;
}

export function PostBottomSheetsProvider({ 
  children, 
  onPostSuccess
}: PostBottomSheetsProviderProps) {
  
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

  const contextValue = {
    openCommentSheet,
    openCreatePostSheet
  };

  return (
    <PostBottomSheetsContext.Provider value={contextValue}>
      {children}
    </PostBottomSheetsContext.Provider>
  );
}