import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/utils/superbase';
import { useInteractionNotifications } from './notifications/useInteractionNotifications';


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
  const { notifyPostComment } = useInteractionNotifications();

  const isFetchingRef = useRef(false);
  const lastFetchedPostId = useRef<string | null>(null);

  const fetchComments = useCallback(async (postId: string) => {
    if (!postId) return;
    if (isFetchingRef.current) return;
    if (loading && lastFetchedPostId.current === postId) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      lastFetchedPostId.current = postId;

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

      const userIds = [...new Set(commentsData.map(comment => comment.user_id))].filter(Boolean);

      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profilesData = profiles || [];
      }

      const profilesMap: Record<string, Comment['profiles']> = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {} as Record<string, Comment['profiles']>);

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
    },
    postOwnerId?: string
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

      if (data && data[0]) {
        const newComment: Comment = {
          ...data[0],
          profiles: userProfile || null
        };
        setComments(prev => [newComment, ...prev]);

        // Send notification if post owner is different from commenter
        if (postOwnerId && postOwnerId !== userId && userProfile) {
          const commenterName = userProfile.name && userProfile.surname
            ? `${userProfile.name} ${userProfile.surname}`
            : userProfile.username || 'Someone';

          await notifyPostComment(postId, postOwnerId, commenterName, content.trim());
        }
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  }, [notifyPostComment]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== commentId));

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

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
    deleteComment,
    formatCommentDate
  };
}
