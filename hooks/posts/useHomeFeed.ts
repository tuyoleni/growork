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
      console.log('🏠 Home feed: Starting to fetch posts...');
      setLoading(true);
      setError(null);

      const postsData = await fetchPostsWithData();
      console.log('🏠 Home feed: Raw posts data received:', postsData?.length || 0, 'posts');

      // Convert each post to the correct format
      const convertedPosts = await Promise.all(
        postsData.map(post => convertDbPostToContentCard(post))
      );

      console.log('🏠 Home feed: Posts converted successfully:', convertedPosts?.length || 0, 'posts');
      setPosts(convertedPosts);
    } catch (err: any) {
      console.error('❌ Home feed: Error fetching posts:', err);
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
