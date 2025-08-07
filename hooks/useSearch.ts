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

        // Step 1: Fetch posts with basic search
        let postsQuery = supabase
          .from('posts')
          .select('*')
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(20);

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

        // Step 2: Process posts and fetch related data
        if (postsData && postsData.length > 0) {
          // Extract unique user IDs
          const userIds = [...new Set(postsData.map(post => post.user_id))].filter(Boolean);

          // Step 3: Fetch profiles separately
          let profilesMap: Record<string, any> = {};
          if (userIds.length > 0) {
            try {
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

              if (profilesError) {
                console.warn('Error fetching profiles:', profilesError);
              } else if (profilesData) {
                profilesMap = profilesData.reduce((map, profile) => {
                  map[profile.id] = profile;
                  return map;
                }, {} as Record<string, any>);
              }
            } catch (profileErr) {
              console.warn('Error in profile fetch:', profileErr);
            }
          }

          // Step 4: Process each post with its related data
          const postsWithData = await Promise.all(
            postsData.map(async (post) => {
              let likesData: any[] = [];
              let commentsData: any[] = [];

              // Fetch likes for this post
              try {
                const { data: likes, error: likesError } = await supabase
                  .from('likes')
                  .select('id, user_id')
                  .eq('post_id', post.id);

                if (likesError) {
                  console.warn(`Error fetching likes for post ${post.id}:`, likesError);
                } else {
                  likesData = likes || [];
                }
              } catch (likesErr) {
                console.warn(`Error in likes fetch for post ${post.id}:`, likesErr);
              }

              // Fetch comments for this post
              try {
                const { data: comments, error: commentsError } = await supabase
                  .from('comments')
                  .select('id, user_id, content, created_at')
                  .eq('post_id', post.id)
                  .order('created_at', { ascending: false });

                if (commentsError) {
                  console.warn(`Error fetching comments for post ${post.id}:`, commentsError);
                } else {
                  commentsData = comments || [];
                }
              } catch (commentsErr) {
                console.warn(`Error in comments fetch for post ${post.id}:`, commentsErr);
              }

              // Return combined post data
              return {
                ...post,
                profiles: profilesMap[post.user_id] || null,
                likes: likesData,
                comments: commentsData,
                _type: 'post' as const
              };
            })
          );

          allResults.push(...postsWithData);
        }

        // Step 5: Fetch documents if requested
        if (includeDocuments) {
          try {
            const { data: documentsData, error: documentsError } = await supabase
              .from('documents')
              .select('*')
              .ilike('name', `%${searchTerm}%`)
              .order('uploaded_at', { ascending: false })
              .limit(10);

            if (documentsError) {
              console.warn('Error fetching documents:', documentsError);
            } else if (documentsData) {
              const documentsWithType = documentsData.map((doc: any) => ({
                ...doc,
                _type: 'document' as const
              }));
              allResults.push(...documentsWithType);
            }
          } catch (documentsErr) {
            console.warn('Error in documents fetch:', documentsErr);
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
