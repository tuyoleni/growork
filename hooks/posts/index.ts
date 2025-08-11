// Main consolidated posts hook
export { usePosts } from './usePosts';

// Specialized variants for specific use cases
export {
  useHomePosts,
  useFeedPosts,
  useMyPosts,
  useSearchPosts,
  usePostsByType
} from './usePosts';

// Consolidated interaction hooks
export { useInteractions } from './useInteractions';
export { useComments } from './useComments';

// Additional post hooks
export { usePostOperations } from './usePostOperations';
export { usePostById } from './usePostById';
export { useHomeFeed } from './useHomeFeed';
export { useCommentOperations } from './useCommentOperations';
export { useTextToSpeech } from './useTextToSpeech';

// Legacy exports for backward compatibility (deprecated)
export { useBookmarks } from './useBookmarks';
export { useLikes } from './useLikes';
export { useCommentLikes } from './useCommentLikes';

// Types
export type {
  PostWithProfile,
  PostFetchConfig
} from './usePosts';

export type {
  BookmarkedItem,
  InteractionState,
  LikeState,
  CommentState,
  BookmarkState
} from './useInteractions';

export type {
  Comment,
  CommentState as CommentStateType
} from './useComments';
