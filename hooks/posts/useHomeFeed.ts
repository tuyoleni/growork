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


      // Convert each post to the correct format with error handling
      const convertedPosts = await Promise.allSettled(
        postsData.map(post => convertDbPostToContentCard(post))
      );

      // Filter out failed conversions and log errors
      const successfulPosts = convertedPosts
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`❌ Failed to convert post ${index}:`, result.reason);
            return null;
          }
        })
        .filter(post => post !== null) as ExtendedContentCardProps[];

      console.log('🏠 Home feed: Posts converted successfully:', successfulPosts?.length || 0, 'posts');
      setPosts(successfulPosts);
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
