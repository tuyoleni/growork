// This hook is deprecated. Use useInteractions from './useInteractions' instead.
// Keeping for backward compatibility only.

import { useInteractions } from './useInteractions';

export function useCommentLikes() {
  // For now, we'll use the same interaction logic but for comments
  // TODO: Extend useInteractions to handle comment likes as well
  
  return {
    loading: false,
    error: null,
    isLiked: () => false, // TODO: Implement comment like checking
    likeComment: async () => ({ success: false, error: 'Not implemented' }),
    unlikeComment: async () => ({ success: false, error: 'Not implemented' }),
    toggleCommentLike: async () => ({ success: false, error: 'Not implemented' })
  };
}
