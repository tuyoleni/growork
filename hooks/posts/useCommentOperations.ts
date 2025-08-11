import { useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { Comment } from '@/types';

export interface CommentWithProfile extends Comment {
  profiles?: {
    id: string;
    name: string;
    surname: string;
    avatar_url?: string;
  };
}

export function useCommentOperations() {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);

  // Fetch comments for a specific post
  const fetchComments = useCallback(async (postId: string): Promise<CommentWithProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(id, name, surname, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsWithProfiles = data || [];
      setComments(commentsWithProfiles);
      return commentsWithProfiles;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }, []);

  // Add a new comment
  const addComment = useCallback(async (postId: string, userId: string, content: string): Promise<CommentWithProfile> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: userId, content }])
        .select(`
          *,
          profiles:user_id(id, name, surname, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newComment = data as CommentWithProfile;
      
      // Add the new comment to the list
      setComments(prev => [newComment, ...prev]);
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Remove the comment from the list
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }, []);

  return {
    comments,
    fetchComments,
    addComment,
    deleteComment,
    setComments
  };
}
