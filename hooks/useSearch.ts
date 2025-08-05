import { useState, useCallback, useRef } from 'react';
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search for better performance
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const allResults: SearchResult[] = [];

        // Fast posts search - only essential fields
        let postsQuery = supabase
          .from('posts')
          .select('id, title, content, type, industry, created_at, user_id')
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(15); // Reduced limit for speed

        if (type) {
          postsQuery = postsQuery.eq('type', type);
        }
        if (industryFilter) {
          postsQuery = postsQuery.eq('industry', industryFilter);
        }

        const { data: postsData, error: postsError } = await postsQuery;

        if (postsError) {
          throw postsError;
        }

        // Add posts to results
        if (postsData && postsData.length > 0) {
          const postsWithType = postsData.map((post: any) => ({
            ...post,
            _type: 'post' as const
          }));
          allResults.push(...postsWithType);
        }

        // Fast documents search - only name field
        if (includeDocuments) {
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('id, name, type, file_url, uploaded_at, user_id')
            .ilike('name', `%${searchTerm}%`)
            .order('uploaded_at', { ascending: false })
            .limit(5); // Reduced limit for speed

          if (documentsError) {
            console.warn('Error fetching documents:', documentsError);
          } else if (documentsData) {
            const documentsWithType = documentsData.map((doc: any) => ({
              ...doc,
              _type: 'document' as const
            }));
            allResults.push(...documentsWithType);
          }
        }

        setResults(allResults);
      } catch (err: any) {
        console.error('Error searching:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
