import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/superbase';
import { PostType } from '@/types';
import { ContentCardProps } from '@/components/content/ContentCard';

// Extended ContentCardProps to include database fields and industry
export type ExtendedContentCardProps = ContentCardProps & {
  industry?: string;
  id?: string;
  user_id?: string;
};

// Interface for database posts
export interface DbPost {
  id: string;
  user_id: string;
  type: PostType;
  title: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
  is_sponsored: boolean;
  industry?: string | null;
  profiles?: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    name: string;
    surname: string;
  };
  likes?: { id: string; user_id: string; post_id: string }[];
  comments?: { id: string; user_id: string; post_id: string; content: string }[];
}

export function useFeedPosts() {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch posts from Supabase
  const fetchPosts = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      // Fetch posts with just the post data first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }
      
      // Get all user IDs from the posts, filtering out any null values
      const userIds = [...new Set(postsData.map(post => post.user_id))].filter(Boolean);
      
      // Fetch the profiles for these users (only if we have valid IDs)
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profilesData = profiles || [];
      }
        
      // Create a map of user IDs to profiles
      const profilesMap = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});
      
      // Fetch likes and comments for each post
      const postsWithRelations = await Promise.all(postsData.map(async (post) => {
        // Fetch likes
        const { data: likesData } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', post.id);
          
        // Fetch comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id);
          
        return {
          ...post,
          profiles: profilesMap[post.user_id] || null,
          likes: likesData || [],
          comments: commentsData || []
        };
      }));
      
      setPosts(postsWithRelations);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Convert database posts to ContentCard format
  const convertDbPostToContentCard = useCallback((post: DbPost): ExtendedContentCardProps => {
    const postProfile = post.profiles || { avatar_url: null, name: 'Anonymous', surname: '' };
    const avatarUrl = postProfile.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(postProfile.name || 'User')}&size=128`;
    
    // Determine post variant based on type
    let variant: 'job' | 'news' | 'sponsored';
    if (post.is_sponsored) {
      variant = 'sponsored';
    } else if (post.type === PostType.Job) {
      variant = 'job';
    } else {
      variant = 'news';
    }

    return {
      id: post.id,
      user_id: post.user_id,
      variant,
      title: postProfile.name + ' ' + postProfile.surname,
      postTitle: post.title || '',
      username: (postProfile as any).username || '',
      name: postProfile.name + ' ' + postProfile.surname,
      avatarImage: avatarUrl,
      mainImage: post.image_url || undefined,
      description: post.content || '',
      badgeText: post.type === PostType.Job ? 'JOB' : 'NEWS',
      badgeVariant: post.type === PostType.Job ? 'success' : 'info',
      isVerified: true,
      industry: post.industry || (variant === 'job' ? 'Technology' : undefined)
    };
  }, []);

  // Add a post
  const addPost = useCallback(async (postData: {
    user_id: string;
    type: PostType;
    title: string;
    content: string;
    image_url?: string | null;
    is_sponsored?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();

      if (error) {
        throw error;
      }

      // Refresh posts after adding
      fetchPosts();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding post:', err);
      return { data: null, error: err.message };
    }
  }, [fetchPosts]);

  // Like or unlike a post
  const toggleLike = useCallback(async (postId: string, userId: string) => {
    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingLike) {
        // Unlike
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) {
          throw unlikeError;
        }
      } else {
        // Like
        const { error: likeError } = await supabase
          .from('likes')
          .insert([{
            post_id: postId,
            user_id: userId
          }]);

        if (likeError) {
          throw likeError;
        }
      }

      // Refresh posts to update the likes count
      fetchPosts();
      return { error: null };
    } catch (err: any) {
      console.error('Error toggling like:', err);
      return { error: err.message };
    }
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refreshing,
    fetchPosts,
    convertDbPostToContentCard,
    addPost,
    toggleLike
  };
}