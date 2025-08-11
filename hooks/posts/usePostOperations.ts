import { useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { PostType } from '@/types';
import { ContentCardProps } from '@/components/content/ContentCard';

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
  company?: string | null;
  company_id?: string | null;
  salary?: string | null;
  job_type?: string | null;
  location?: string | null;
  source?: string | null;
  published_at?: string | null;
  likes?: { id: string; user_id: string; post_id: string }[];
  comments?: { id: string; user_id: string; post_id: string; content: string }[];
}

export function usePostOperations() {
  // Convert database posts to ContentCard format
  const convertDbPostToContentCard = useCallback(async (post: DbPost): Promise<ExtendedContentCardProps> => {
    console.log('🔄 Converting post:', { id: post.id, title: post.title, user_id: post.user_id });

    // Fetch profile data separately since we can't join directly
    let postProfile: { avatar_url: string | null; name: string; surname: string; username?: string | null } = {
      avatar_url: null,
      name: 'Anonymous',
      surname: ''
    };

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, avatar_url, username, name, surname')
        .eq('id', post.user_id)
        .maybeSingle();

      if (!profileError && profileData) {
        postProfile = profileData;
        console.log('👤 Profile fetched for post:', post.id, 'User:', postProfile.name);
      } else if (profileError) {
        console.warn('⚠️ Profile fetch error for post:', post.id, profileError);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching profile data for post:', post.id, error);
    }

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

    // Use the company data directly from the post
    let company = undefined;
    if (post.company) {
      company = {
        id: post.company_id || 'temp-id',
        name: post.company,
        logo_url: undefined,
        industry: post.industry || undefined,
        location: post.location || undefined,
        status: undefined,
      };
    }

    const convertedPost = {
      id: post.id,
      title: post.title || '',
      description: post.content || '',
      mainImage: post.image_url || undefined,
      createdAt: post.created_at,
      variant,
      company,
      user_id: post.user_id,
      // Additional fields for job posts
      ...(post.type === PostType.Job ? {
        criteria: {
          companyId: post.company_id || undefined,
          company: post.company || undefined,
          location: post.location || undefined,
          salary: post.salary || undefined,
          jobType: post.job_type || undefined,
        }
      } : {}),
      // Additional fields for news posts
      ...(post.type === PostType.News ? {
        criteria: {
          source: post.source || undefined,
          publication_date: post.published_at || undefined,
        }
      } : {}),
    };

    return convertedPost;
  }, []);

  // Fetch posts with related data (profiles, likes, comments)
  const fetchPostsWithData = useCallback(async (filters?: {
    type?: PostType;
    industry?: string;
    userId?: string;
    limit?: number;
  }) => {
    try {
      console.log('🔍 Fetching posts with filters:', filters);

      // First, let's test a simple query to see if we can access the posts table at all
      console.log('🧪 Testing basic posts table access...');

      // Check total count of posts
      const { count: totalPosts, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Posts count failed:', countError);
      } else {
        console.log('📊 Total posts in database:', totalPosts);
      }

      const { data: testData, error: testError } = await supabase
        .from('posts')
        .select('id, title, type')
        .limit(1);

      if (testError) {
        console.error('❌ Basic posts table access failed:', testError);
        console.error('❌ Error details:', testError.message, testError.details, testError.hint);
        throw testError;
      } else {
        console.log('✅ Basic posts table access successful:', testData?.length || 0, 'posts');
        if (testData && testData.length > 0) {
          console.log('🧪 Test post found:', testData[0]);
        }
      }

      let query = supabase
        .from('posts')
        .select(`
          *,
          likes(id, user_id),
          comments(id, user_id, content, created_at)
        `)
        .order('created_at', { ascending: false });

      console.log('🔍 Database query built for posts table');

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) {
        console.error('❌ Error fetching posts:', postsError);
        throw postsError;
      }

      console.log('✅ Posts fetched successfully:', postsData?.length || 0, 'posts');
      if (postsData && postsData.length > 0) {
        console.log('📝 Sample post:', {
          id: postsData[0].id,
          title: postsData[0].id,
          user_id: postsData[0].user_id,
          type: postsData[0].type,
          criteria: (postsData[0] as any).criteria
        });

        // Log all available fields to debug
        console.log('🔍 All post fields:', Object.keys(postsData[0]));
        console.log('🔍 Full post data:', postsData[0]);
      }

      return postsData || [];
    } catch (error) {
      console.error('❌ Error fetching posts with data:', error);
      throw error;
    }
  }, []);

  return {
    convertDbPostToContentCard,
    fetchPostsWithData,
  };
}
