import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '../auth/useAuth';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string;
    name?: string;
    surname?: string;
    avatar_url?: string;
  };
}

export interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export function useComments(postId: string) {
  const [state, setState] = useState<CommentState>({
    comments: [],
    loading: false,
    error: null
  });

  const { user } = useAuth();
  const lastFetchedPostId = useRef<string | null>(null);

  // Fetch comments for a post
  const fetchComments = useCallback(async (targetPostId: string) => {
    if (!targetPostId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            username,
            name,
            surname,
            avatar_url
          )
        `)
        .eq('post_id', targetPostId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        comments: data || [],
        loading: false
      }));
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch comments'
      }));
    }
  }, []);

  // Add a new comment
  const addComment = useCallback(async (content: string) => {
    if (!user || !postId || !content.trim()) {
      return { success: false, error: 'Invalid input' };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        })
        .select(`
          *,
          profiles (
            id,
            username,
            name,
            surname,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add new comment to local state
      setState(prev => ({
        ...prev,
        comments: [...prev.comments, data],
        loading: false
      }));

      // TODO: Send notification when notification system is ready
      // await notifyPostComment(postId, postOwnerId, userProfile, content);

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add comment';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [user, postId]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      // Remove comment from local state
      setState(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.id !== commentId),
        loading: false
      }));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete comment';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [user]);

  // Update a comment
  const updateComment = useCallback(async (commentId: string, newContent: string) => {
    if (!user || !newContent.trim()) {
      return { success: false, error: 'Invalid input' };
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('comments')
        .update({
          content: newContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id) // Ensure user can only update their own comments
        .select(`
          *,
          profiles (
            id,
            username,
            name,
            surname,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update comment in local state
      setState(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.id === commentId ? data : comment
        ),
        loading: false
      }));

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update comment';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [user]);

  // Fetch comments when postId changes
  useEffect(() => {
    if (postId && postId !== lastFetchedPostId.current) {
      lastFetchedPostId.current = postId;
      fetchComments(postId);
    }
  }, [postId, fetchComments]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    comments: state.comments,
    loading: state.loading,
    error: state.error,

    // Actions
    addComment,
    deleteComment,
    updateComment,
    fetchComments,
    clearError,

    // Utilities
    commentCount: state.comments.length
  };
}
