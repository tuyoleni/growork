import React, { createContext, useRef, useCallback, ReactNode } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

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
  commentSheetRef: React.RefObject<BottomSheetModal & {openWithPostId: (postId: string) => void}>;
  createPostSheetRef: React.RefObject<BottomSheetModal>;
}

export function PostBottomSheetsProvider({ 
  children, 
  commentSheetRef, 
  createPostSheetRef 
}: PostBottomSheetsProviderProps) {
  
  const openCommentSheet = useCallback((postId: string) => {
    if (commentSheetRef.current?.openWithPostId) {
      commentSheetRef.current.openWithPostId(postId);
    }
  }, [commentSheetRef]);

  const openCreatePostSheet = useCallback(() => {
    if (createPostSheetRef.current) {
      createPostSheetRef.current.present();
    }
  }, [createPostSheetRef]);

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