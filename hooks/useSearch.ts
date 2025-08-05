import { useState, useCallback } from 'react';
import { supabase } from '@/utils/superbase';
import { PostWithProfile } from './usePosts';
import { Document } from '@/types/documents';
import { PostType } from '@/types/enums';

export type SearchResult =
  | (PostWithProfile & { _type: 'post' })
  | (Document & { _type: 'document' });

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    searchTerm: string, 
    type?: PostType, 
    industryFilter?: string,
    includeDocuments: boolean = true
  ) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            name,
            surname,
            avatar_url
          )
        `)
        .or(`
          title.ilike.%${searchTerm}%,
          content.ilike.%${searchTerm}%,
          criteria->>company.ilike.%${searchTerm}%,
          criteria->>location.ilike.%${searchTerm}%,
          criteria->>author.ilike.%${searchTerm}%,
          criteria->>source.ilike.%${searchTerm}%,
          industry.ilike.%${searchTerm}%,
          profiles.username.ilike.%${searchTerm}%,
          profiles.name.ilike.%${searchTerm}%,
          profiles.surname.ilike.%${searchTerm}%
        `)
        .order('created_at', { ascending: false });
      
      if (type) {
        postsQuery = postsQuery.eq('type', type);
      }

      if (industryFilter) {
        postsQuery = postsQuery.eq('industry', industryFilter);
      }

      // Enhanced search query for documents
      let documentsQuery = null;
      if (includeDocuments) {
        documentsQuery = supabase
          .from('documents')
          .select('*')
          .or(`
            name.ilike.%${searchTerm}%,
            type.ilike.%${searchTerm}%
          `)
          .order('uploaded_at', { ascending: false });
      }

      // Execute search queries
      const [postsData, documentsData] = await Promise.all([
        postsQuery,
        documentsQuery || Promise.resolve({ data: null, error: null })
      ]);

      if (postsData.error) {
        throw postsData.error;
      }

      const allResults: SearchResult[] = [];

      // Process posts with user profiles
      if (postsData.data && postsData.data.length > 0) {
        // For each post, fetch likes and comments
        const postsWithData = await Promise.all(postsData.data.map(async (post: any) => {
          // Fetch likes for this post
          const { data: likesData, error: likesError } = await supabase
            .from('likes')
            .select('id, user_id')
            .eq('post_id', post.id);
          
          if (likesError) {
            console.warn(`Error fetching likes for post ${post.id}:`, likesError);
          }
          
          // Fetch comments for this post
          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('id, user_id, content, created_at')
            .eq('post_id', post.id)
            .order('created_at', { ascending: false });
          
          if (commentsError) {
            console.warn(`Error fetching comments for post ${post.id}:`, commentsError);
          }
          
          // Return post with profile, likes, and comments
          return {
            ...post,
            profiles: post.profiles || null,
            likes: likesData || [],
            comments: commentsData || [],
            _type: 'post' as const
          };
        }));
        
        allResults.push(...postsWithData);
      }

      // Process documents
      if (includeDocuments && documentsData && !documentsData.error && documentsData.data) {
        const documentsWithType = documentsData.data.map((doc: any) => ({
          ...doc,
          _type: 'document' as const
        }));
        
        allResults.push(...documentsWithType);
      }

      setResults(allResults);
    } catch (err: any) {
      console.error('Error searching:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
} 