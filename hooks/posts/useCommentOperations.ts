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
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Then fetch profiles for the user IDs
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, surname, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        }

        // Create a map of user profiles
        const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        // Combine comments with profiles
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap[comment.user_id] || null
        }));

        setComments(commentsWithProfiles);
        return commentsWithProfiles;
      } else {
        setComments([]);
        return [];
      }
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
        .select('*')
        .single();

      if (error) throw error;

      // Fetch the user's profile for the new comment
      let profile = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, surname, avatar_url')
          .eq('id', userId)
          .single();

        if (!profileError && profileData) {
          profile = profileData;
        }
      } catch (profileErr) {
        console.warn('Error fetching profile for new comment:', profileErr);
      }

      // Create comment with profile data
      const newComment = {
        ...data,
        profiles: profile
      } as CommentWithProfile;

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
