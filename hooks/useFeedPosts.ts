import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/superbase';
import { PostType } from '@/types';
import { ContentCardProps } from '@/components/content/ContentCard';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SUBSCRIPTION_CONFIG } from '@/constants/subscriptionConfig';
import { cleanupSubscription, cleanupInterval, cleanupTimeout } from '@/utils/subscriptionUtils';

// Extended ContentCardProps to include database fields and industry
export type ExtendedContentCardProps = ContentCardProps & {
  industry?: string;
  id?: string;
  user_id?: string;
};

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

export function useFeedPosts(pollingInterval = SUBSCRIPTION_CONFIG.POLLING_INTERVAL) {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [convertedPosts, setConvertedPosts] = useState<ExtendedContentCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert database posts to ContentCard format
  const convertDbPostToContentCard = useCallback(async (post: DbPost): Promise<ExtendedContentCardProps> => {
    const postProfile = post.profiles || { avatar_url: null, name: 'Anonymous', surname: '' };

    // Get criteria and company info
    const criteria = (post as any).criteria || {};
    const companyName = (post.type === PostType.Job && criteria?.company)
      ? criteria.company
      : undefined;
    const newsSource = (post.type === PostType.News && (criteria?.source || criteria?.author))
      ? (criteria.source || criteria.author)
      : undefined;

    // Determine post variant based on type
    let variant: 'job' | 'news' | 'sponsored';
    if (post.is_sponsored) {
      variant = 'sponsored';
    } else if (post.type === PostType.Job) {
      variant = 'job';
    } else {
      variant = 'news';
    }

    // Prepare author profile data
    const authorProfile = postProfile && 'id' in postProfile ? {
      id: postProfile.id,
      name: postProfile.name,
      surname: postProfile.surname,
      username: postProfile.username || undefined,
      avatar_url: postProfile.avatar_url || undefined,
      profession: undefined,
      location: undefined,
    } : undefined;

    // Prepare company data if available - fetch actual company data
    let company = undefined;
    if (criteria?.companyId) {
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', criteria.companyId)
          .maybeSingle();

        if (!companyError && companyData) {
          company = {
            id: companyData.id,
            name: companyData.name || criteria.company || '',
            logo_url: companyData.logo_url || undefined,
            industry: companyData.industry || criteria.industry || undefined,
            location: companyData.location || criteria.location || undefined,
            status: companyData.status || criteria.companyStatus || undefined,
          };
        } else if (companyError && companyError.code === 'PGRST116') {
          // Company not found - this is expected for some posts
          console.log('Company not found for ID:', criteria.companyId, '- using fallback data');
          // Fallback to criteria data
          company = {
            id: criteria.companyId,
            name: criteria.company || '',
            logo_url: undefined,
            industry: criteria.industry || undefined,
            location: criteria.location || undefined,
            status: criteria.companyStatus || undefined,
          };
        } else if (companyError) {
          console.warn('Failed to fetch company data for ID:', criteria.companyId, companyError);
          // Fallback to criteria data
          company = {
            id: criteria.companyId,
            name: criteria.company || '',
            logo_url: undefined,
            industry: criteria.industry || undefined,
            location: criteria.location || undefined,
            status: criteria.companyStatus || undefined,
          };
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        // Fallback to criteria data
        company = {
          id: criteria.companyId,
          name: criteria.company || '',
          logo_url: undefined,
          industry: criteria.industry || undefined,
          location: criteria.location || undefined,
          status: criteria.companyStatus || undefined,
        };
      }
    }

    return {
      id: post.id,
      user_id: post.user_id,
      variant,
      title: post.title || '',
      description: post.content || '',
      mainImage: post.image_url || undefined,
      createdAt: post.created_at,
      criteria: criteria || null,
      isVerified: true,
      industry: post.industry || (variant === 'job' ? 'Technology' : undefined),
      company,
    };
  }, []);

  // Convert all posts to ContentCard format
  const convertAllPosts = useCallback(async (dbPosts: DbPost[]) => {
    const converted = await Promise.all(dbPosts.map(convertDbPostToContentCard));
    setConvertedPosts(converted);
  }, [convertDbPostToContentCard]);

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
      await convertAllPosts(postsWithRelations); // Convert posts after fetching
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, convertAllPosts]);

  // Setup real-time subscription and polling
  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    fetchPosts();

    // Setup Supabase real-time subscription with better error handling
    const setupRealTimeSubscription = async (retryCount = 0) => {
      if (!isMounted) return;
      try {
        console.log('Setting up real-time subscription for posts...', retryCount > 0 ? `(retry ${retryCount})` : '');

        // Clean up any existing subscription first
        subscriptionRef.current = cleanupSubscription(subscriptionRef.current);

        // Check if we have a valid session before setting up real-time
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No active session - skipping real-time subscription, using polling only');
          return;
        }

        subscriptionRef.current = supabase
          .channel('posts_channel')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'posts'
            },
            async (payload) => {
              console.log('Real-time update received:', payload);
              // Fetch fresh data when any change occurs
              await fetchPosts(true);
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to posts real-time updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to posts real-time updates - falling back to polling only');
              // Only retry once to avoid excessive retries
              if (retryCount < SUBSCRIPTION_CONFIG.MAX_RETRIES && isMounted) {
                console.log('Retrying real-time subscription...');
                setTimeout(() => setupRealTimeSubscription(retryCount + 1), SUBSCRIPTION_CONFIG.RETRY_DELAY);
              }
            } else if (status === 'TIMED_OUT') {
              console.warn('Real-time subscription timed out - falling back to polling only');
            } else if (status === 'CLOSED') {
              console.log('Real-time subscription closed');
            }
          });

        // Add a timeout to detect if subscription fails to establish
        const subscriptionTimeout = setTimeout(() => {
          if (subscriptionRef.current) {
            console.warn('Real-time subscription may not have established within timeout - continuing with polling');
          }
        }, SUBSCRIPTION_CONFIG.SUBSCRIPTION_TIMEOUT);

        // Clean up timeout
        return () => cleanupTimeout(subscriptionTimeout);
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
        // Only retry once to avoid excessive retries
        if (retryCount < SUBSCRIPTION_CONFIG.MAX_RETRIES && isMounted) {
          console.log('Retrying real-time subscription due to error...');
          setTimeout(() => setupRealTimeSubscription(retryCount + 1), SUBSCRIPTION_CONFIG.RETRY_DELAY);
        }
      }
    };

    // Setup real-time subscription
    setupRealTimeSubscription();

    // Setup polling as fallback (every 30 seconds)
    console.log('Setting up polling fallback...');
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling for new posts...');
      fetchPosts(true);
    }, pollingInterval);

    // Cleanup function
    return () => {
      isMounted = false;
      console.log('Cleaning up real-time subscription and polling...');
      // Cleanup Supabase subscription
      subscriptionRef.current = cleanupSubscription(subscriptionRef.current);

      // Cleanup polling interval
      pollingIntervalRef.current = cleanupInterval(pollingIntervalRef.current);
    };
  }, [fetchPosts, pollingInterval]);

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
    convertedPosts, // Expose converted posts
    loading,
    error,
    refreshing,
    fetchPosts,
    addPost,
    toggleLike
  };
}