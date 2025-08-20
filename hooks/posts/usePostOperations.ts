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
  criteria?: any; // JSON field containing criteria data
  likes?: { id: string; user_id: string; post_id: string }[];
  comments?: { id: string; user_id: string; post_id: string; content: string }[];
}

export function usePostOperations() {
  const convertDbPostToContentCard = useCallback(async (post: DbPost): Promise<ExtendedContentCardProps> => {
    console.log('🔄 convertDbPostToContentCard: Post ID:', post.id, 'Type:', post.type);
    console.log('📋 Full post data:', JSON.stringify(post, null, 2));


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

      } else if (profileError) {
        console.warn('⚠️ Profile fetch error for post:', post.id, profileError);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching profile data for post:', post.id, error);
    }

    // const newsSource = (post.type === PostType.News && post.criteria?.source)
    //   ? post.criteria.source
    //   : undefined;

    // Determine variant based on post type
    // const variant: 'job' | 'news' = post.type === PostType.Job ? 'job' : 'news';

    // const authorProfile = postProfile && 'id' in postProfile ? {
    //   id: postProfile.id,
    //   name: postProfile.name,
    //   surname: postProfile.surname,
    //   username: postProfile.username || undefined,
    //   avatar_url: postProfile.avatar_url || undefined,
    //   profession: undefined,
    //   location: undefined,
    // } : undefined;

    // Build criteria object from JSON criteria field
    const criteriaData = post.criteria || {};
    console.log('📋 Raw criteria data from post:', JSON.stringify(criteriaData, null, 2));

    const criteria = {
      companyId: criteriaData.companyId || undefined,
      company: criteriaData.company || undefined,
      location: criteriaData.location || undefined,
      salary: criteriaData.salary || undefined,
      jobType: criteriaData.jobType || undefined,
      source: criteriaData.source || undefined,
      publication_date: criteriaData.publication_date || undefined,
    };

    console.log('📋 Built criteria object:', JSON.stringify(criteria, null, 2));

    const convertedPost: ExtendedContentCardProps = {
      id: post.id,
      title: post.title || '',
      description: post.content || '',
      mainImage: post.image_url || undefined,
      createdAt: post.created_at,
      variant: post.type === PostType.Job ? 'job' : 'news',
      user_id: post.user_id,
      criteria: criteria,
    };

    return convertedPost;
  }, []);

  const fetchPostsWithData = useCallback(async (filters?: {
    type?: PostType;
    industry?: string;
    userId?: string;
    limit?: number;
  }) => {
    try {


      // const { count: totalPosts, error: countError } = await supabase
      //   .from('posts')
      //   .select('*', { count: 'exact', head: true });

      // if (countError) {
      //   console.error('❌ Posts count failed:', countError);
      // } else {

      // }

      // const { data: testData, error: testError } = await supabase
      //   .from('posts')
      //   .select('id, title, type')
      //   .limit(1);

      // if (testError) {
      //   console.error('❌ Basic posts table access failed:', testError);
      //   console.error('❌ Error details:', testError.message, testError.details, testError.hint);
      //   throw testError;
      // } else {

      // }

      let query = supabase
        .from('posts')
        .select(`
          *,
          likes(id, user_id),
          comments(id, user_id, content, created_at)
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

      console.log('🔍 fetchPostsWithData: Raw posts query result:', JSON.stringify(postsData, null, 2));
      console.log('🔍 fetchPostsWithData: Posts error:', JSON.stringify(postsError, null, 2));

      if (postsError) {
        console.error('❌ Error fetching posts:', postsError);
        throw postsError;
      }



      return postsData || [];
    } catch (error) {
      console.error('❌ Error fetching posts with data:', error);
      throw error;
    }
  }, []);

  const addPost = useCallback(async (postData: {
    user_id: string;
    type: PostType;
    title: string;
    content: string;
    image_url?: string | null;
    industry?: string | null;
    is_sponsored?: boolean;
    criteria?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: postData.user_id,
          type: postData.type,
          title: postData.title,
          content: postData.content,
          image_url: postData.image_url || null,
          industry: postData.industry || null,
          is_sponsored: postData.is_sponsored || false,
          criteria: postData.criteria || null,
        }])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating post:', error);
        throw error;
      }

      console.log('✅ Post created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in addPost:', error);
      return { data: null, error };
    }
  }, []);

  return {
    convertDbPostToContentCard,
    fetchPostsWithData,
    addPost,
  };
}

export const addPost = async (postData: {
  user_id: string;
  type: PostType;
  title: string;
  content: string;
  image_url?: string | null;
  industry?: string | null;
  is_sponsored?: boolean;
  criteria?: any;
}) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        user_id: postData.user_id,
        type: postData.type,
        title: postData.title,
        content: postData.content,
        image_url: postData.image_url || null,
        industry: postData.industry || null,
        is_sponsored: postData.is_sponsored || false,
        criteria: postData.criteria || null,
      }])
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }

    console.log('✅ Post created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error in addPost:', error);
    return { data: null, error };
  }
};
