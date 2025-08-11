import { useCallback, useState, useEffect } from 'react';
import { usePostOperations } from './usePostOperations';
import { ExtendedContentCardProps } from './usePostOperations';
import { PostType } from '@/types';

export function useHomeFeed() {
  const [posts, setPosts] = useState<ExtendedContentCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchPostsWithData, convertDbPostToContentCard } = usePostOperations();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const postsData = await fetchPostsWithData();
      
      // Convert each post to the correct format
      const convertedPosts = await Promise.all(
        postsData.map(post => convertDbPostToContentCard(post))
      );
      
      setPosts(convertedPosts);
    } catch (err: any) {
      console.error('Error fetching home feed posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchPostsWithData, convertDbPostToContentCard]);

  const refresh = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refresh,
  };
}
