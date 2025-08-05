import React, { createContext, ReactNode } from 'react';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import { DocumentType } from '@/types';

interface PostBottomSheetsContextType {
  openCommentSheet: (postId: string) => void;
  openCreatePostSheet: () => void;
  openDocumentsSheet: (userId?: string, documentType?: DocumentType) => void;
}

export const PostBottomSheetsContext = createContext<PostBottomSheetsContextType>({
  openCommentSheet: () => {},
  openCreatePostSheet: () => {},
  openDocumentsSheet: () => {},
});

interface PostBottomSheetsProviderProps {
  children: ReactNode;
  onPostSuccess?: () => void;
}

export function PostBottomSheetsProvider({ 
  children, 
  onPostSuccess
}: PostBottomSheetsProviderProps) {
  
  const {
    openCommentSheet,
    openCreatePostSheet,
    openDocumentsSheet
  } = useBottomSheetManager({ onPostSuccess });

  const contextValue = {
    openCommentSheet,
    openCreatePostSheet,
    openDocumentsSheet
  };

  return (
    <PostBottomSheetsContext.Provider value={contextValue}>
      {children}
    </PostBottomSheetsContext.Provider>
  );
}