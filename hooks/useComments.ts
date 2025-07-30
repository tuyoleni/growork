import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/utils/superbase';

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    avatar_url: string | null;
    name: string;
    surname: string;
    username: string | null;
  } | null;
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we're currently fetching, and track last fetched post to avoid redundant fetches
  const isFetchingRef = useRef(false);
  const lastFetchedPostId = useRef<string | null>(null);

  // Fetch comments for a specific post
  const fetchComments = useCallback(async (postId: string) => {
    if (!postId) return;

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;

    // Skip if we're already loading comments for this post
    if (loading && lastFetchedPostId.current === postId) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      lastFetchedPostId.current = postId;

      // Fetch comments for this post
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get user IDs from comments (filter out null values)
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))].filter(Boolean);

      // Fetch profiles for these users
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profilesData = profiles || [];
      }

      // Create a map of user IDs to profiles
      const profilesMap: Record<string, Comment['profiles']> = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {} as Record<string, Comment['profiles']>);

      // Combine comments with profiles
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || null,
      }));

      setComments(commentsWithProfiles as Comment[]);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      lastFetchedPostId.current = null;
    }
  }, [loading]);

  // Add a new comment
  const addComment = useCallback(async (
    postId: string,
    userId: string,
    content: string,
    userProfile?: {
      id: string;
      avatar_url: string | null;
      name: string;
      surname: string;
      username: string | null;
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          post_id: postId,
          content: content.trim(),
        })
        .select(`
          id,
          user_id,
          post_id,
          content,
          created_at
        `);

      if (error) throw error;

      // Add the new comment to the list with user profile
      if (data && data[0]) {
        const newComment: Comment = {
          ...data[0],
          profiles: userProfile || null
        };
        setComments(prev => [newComment, ...prev]);
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  }, []);

  // Format date for display
  const formatCommentDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  }, []);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    formatCommentDate
  };
}
