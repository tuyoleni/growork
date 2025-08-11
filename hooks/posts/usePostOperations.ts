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

export function usePostOperations() {
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
        }
      } catch (error) {
        console.warn('Error fetching company data:', error);
      }
    }

    return {
      id: post.id,
      title: post.title || '',
      description: post.content || '',
      mainImage: post.image_url || undefined,
      createdAt: post.created_at,
      variant,
      company,
      user_id: post.user_id,
      // Additional fields for job posts
      ...(post.type === PostType.Job && criteria ? {
        criteria: {
          companyId: criteria.companyId || undefined,
          company: companyName || undefined,
          location: criteria.location || undefined,
          salary: criteria.salary || undefined,
          jobType: criteria.jobType || undefined,
        }
      } : {}),
      // Additional fields for news posts
      ...(post.type === PostType.News && criteria ? {
        criteria: {
          source: criteria.source || undefined,
          publication_date: criteria.publishedAt || undefined,
        }
      } : {}),
    };
  }, []);

  // Fetch posts with related data (profiles, likes, comments)
  const fetchPostsWithData = useCallback(async (filters?: {
    type?: PostType;
    industry?: string;
    userId?: string;
    limit?: number;
  }) => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(id, avatar_url, username, name, surname),
          likes:post_id(id, user_id),
          comments:post_id(id, user_id, content, created_at),
          criteria:post_id(*)
        `)
        .order('created_at', { ascending: false });

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
        throw postsError;
      }

      return postsData || [];
    } catch (error) {
      console.error('Error fetching posts with data:', error);
      throw error;
    }
  }, []);

  return {
    convertDbPostToContentCard,
    fetchPostsWithData,
  };
}
