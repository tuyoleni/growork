import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/superbase';
import { ContentCardProps } from '@/components/content/ContentCard';

// Type for the posts with industry
export type ExtendedContentCardProps = ContentCardProps & {
  industry?: string;
  id?: string;
  user_id?: string;
};

export function useHomePosts() {
  const [posts, setPosts] = useState<ExtendedContentCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch posts from Supabase and convert them to the UI format
  const fetchPosts = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Step 1: Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Step 2: Get user profiles for these posts
      const userIds = [...new Set(postsData.map(post => post.user_id))].filter(Boolean);

      // Only fetch profiles if we have valid user IDs
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profilesData = profiles || [];
      }

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      const formattedPosts = postsData.map(post => {
        const profile = profilesMap[post.user_id];
        const avatarUrl = profile?.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&size=128`;

        let variant: 'job' | 'news' | 'sponsored';
        let industry = 'Technology'; // Default industry

        if (post.is_sponsored) {
          variant = 'sponsored';
        } else if (post.type === 'job') {
          variant = 'job';
          industry = 'Technology'; // You might want to add this as a field in your posts table
        } else {
          variant = 'news';
        }

        return {
          id: post.id,
          user_id: post.user_id,
          variant,
          title: profile ? `${profile.name || ''} ${profile.surname || ''}`.trim() : 'Anonymous',
          postTitle: post.title || '',
          username: profile?.username || '',
          name: profile ? `${profile.name || ''} ${profile.surname || ''}`.trim() : 'Anonymous',
          avatarImage: avatarUrl,
          mainImage: post.image_url || undefined,
          description: post.content || post.title || '',
          badgeText: variant === 'job' ? 'JOB' : 'NEWS',
          badgeVariant: (variant === 'job' ? 'success' : 'info') as 'success' | 'info',
          isVerified: true,
          industry,
        };
      });

      setPosts(formattedPosts);

    } catch (err: any) {
      console.error('Error fetching home posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load posts on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refreshing,
    fetchPosts
  };
}