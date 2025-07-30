import ContentCard, { ContentCardProps } from '@/components/content/ContentCard';
import Header, { HEADER_HEIGHT } from '@/components/home/Header';
import ScreenContainer from '@/components/ScreenContainer';
import CommentBottomSheet from '@/components/content/CommentBottomSheet';
import CreatePostBottomSheet from '@/components/content/CreatePostBottomSheet';
import { PostBottomSheetsProvider } from '@/utils/PostBottomSheetsContext';
import { supabase } from '@/utils/superbase';
import { useAuth } from '@/hooks/useAuth';
import { PostType } from '@/types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, NativeScrollEvent, NativeSyntheticEvent, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';

// Extended ContentCardProps to include database fields and industry
type ExtendedContentCardProps = ContentCardProps & {
  industry?: string;
  id?: string;
};

// Interface for database posts
interface DbPost {
  id: string;
  user_id: string;
  type: PostType;
  title: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
  is_sponsored: boolean;
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


export default function Home() {
  const headerHeight = HEADER_HEIGHT;
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const commentSheetRef = useRef<any>(null);
  const createPostSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;

  // State for posts and loading
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [selectedContentType, setSelectedContentType] = useState(0); // 0: All, 1: Jobs, 2: News
  const [selectedIndustry, setSelectedIndustry] = useState(-1); // -1: All industries

  // Helper function to get industry label from index
  const getIndustryLabel = (index: number) => {
    const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Design', 'Software', 'Entertainment', 'E-commerce', 'Fintech', 'Automotive'];
    return industries[index] || '';
  };// Fetch posts from Supabase
  const fetchPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Step 1: Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

// Step 2: Fetch profiles for these posts (filter out null values)
      const userIds = [...new Set(postsData.map(post => post.user_id))].filter(Boolean);
      
      // Initialize profile data
      let profiles = [];
      let profilesFetchError = null;
      
      // Only fetch if we have valid user IDs
      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        profiles = data || [];
        profilesFetchError = error;
      }
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.warn("Error fetching profiles:", profilesError);
      }

      // Create a map of user IDs to profiles
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Step 3: Fetch likes for all posts
      const postIds = postsData.map(post => post.id);
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .in('post_id', postIds);

      if (likesError) {
        console.warn("Error fetching likes:", likesError);
      }

      // Group likes by post ID
      const likesMap = (likesData || []).reduce((acc, like) => {
        if (!acc[like.post_id]) {
          acc[like.post_id] = [];
        }
        acc[like.post_id].push(like);
        return acc;
      }, {});

      // Step 4: Fetch comments for all posts
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds);

      if (commentsError) {
        console.warn("Error fetching comments:", commentsError);
        // Continue anyway without comments
      }

      // Group comments by post ID
      const commentsMap = (commentsData || []).reduce((acc, comment) => {
        if (!acc[comment.post_id]) {
          acc[comment.post_id] = [];
        }
        acc[comment.post_id].push(comment);
        return acc;
      }, {});

      // Step 5: Combine all data
      const postsWithRelations = postsData.map(post => ({
        ...post,
        profiles: profilesMap[post.user_id] || null,
        likes: likesMap[post.id] || [],
        comments: commentsMap[post.id] || []
      }));

      setPosts(postsWithRelations);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    fetchPosts(true);
  };

  // Convert database posts to ContentCard format
  const convertDbPostToContentCard = (post: DbPost): ExtendedContentCardProps => {
    const postProfile = post.profiles || { avatar_url: null, name: 'Anonymous', surname: '' };
    const avatarUrl = postProfile.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(postProfile.name || 'User')}&size=128`;

    // Determine post variant based on type
    let variant: 'job' | 'news' | 'sponsored';
    if (post.is_sponsored) {
      variant = 'sponsored';
    } else if (post.type === PostType.Job) {
      variant = 'job';
    } else {
      variant = 'news';
    }

    return {
      id: post.id,
      user_id: post.user_id,
      variant,
      title: postProfile.name + ' ' + postProfile.surname,
      avatarImage: avatarUrl,
      mainImage: post.image_url || undefined,
      description: post.content || '',
      badgeText: post.type === PostType.Job ? 'JOB' : 'NEWS',
      badgeVariant: post.type === PostType.Job ? 'success' : 'info',
      // No hardcoded posts - we'll fetch everything from the database
      industry: variant === 'job' ? 'Technology' : undefined // You might want to add an industry field to your posts table
    };
  };// Filter posts based on selected filters using useMemo for stability
  const filteredPosts = useMemo(() => {
    // Always use real posts from the database
    return posts
      .map(convertDbPostToContentCard)
      .filter(post => {
        // Sponsored content is always visible
        if (post.variant === 'sponsored') return true;

        // Content type filter for jobs and news
        if (selectedContentType === 1 && post.variant !== 'job') return false;
        if (selectedContentType === 2 && post.variant !== 'news') return false;

        // Industry filter (if an industry is selected) - only applies to jobs and news
        if (selectedIndustry !== -1) {
          const selectedIndustryLabel = getIndustryLabel(selectedIndustry);
          if (post.industry !== selectedIndustryLabel) return false;
        }

        return true;
      });
  }, [posts, selectedContentType, selectedIndustry]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    if (y < 40) {
      lastScrollY.current = y;
      return;
    }
    if (diff > 10 && !isAnimating.current && headerVisible) {
      // Scrolling down, hide header immediately
      isAnimating.current = true;
      Animated.timing(headerAnim, {
        toValue: -HEADER_HEIGHT,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setHeaderVisible(false);
        isAnimating.current = false;
      });
    } else if (diff < -10 && !isAnimating.current && !headerVisible) {
      // Scrolling up, show header after a delay
      isAnimating.current = true;
      setTimeout(() => {
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setHeaderVisible(true);
          isAnimating.current = false;
        });
      }, 300); // 300ms delay before revealing
    }
    lastScrollY.current = y;
  };

  // Handle post success
  const handlePostSuccess = () => {
    fetchPosts();
  };

  // Check if loading
  if (loading && !posts.length) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <PostBottomSheetsProvider
      commentSheetRef={commentSheetRef}
      createPostSheetRef={createPostSheetRef}
    >
      <ScreenContainer>
        <Animated.View style={{
          transform: [{ translateY: headerAnim }],
          zIndex: 10,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
        }}>
          <Header
            selectedContentType={selectedContentType}
            onContentTypeChange={setSelectedContentType}
            selectedIndustry={selectedIndustry}
            onIndustryChange={setSelectedIndustry}
          />
          {/* Add Create Post button */}
          <Pressable
            style={{
              position: 'absolute',
              right: 16,
              bottom: 12,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#3b82f6',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => createPostSheetRef.current?.present()}
          >
            <Feather name="plus" size={24} color="#fff" />
          </Pressable>
        </Animated.View><Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{ paddingTop: 0 }}
        >
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <ContentCard
                key={`${post.title}-${post.variant}-${index}-${post.id || 'unknown'}`}
                {...post}
                style={index === 0 ? { marginTop: HEADER_HEIGHT - 48 } : undefined}
              />
            ))
          ) : (
            // Show empty state if no posts after filters are applied
            <View style={{ flex: 1, padding: 20, alignItems: 'center', marginTop: HEADER_HEIGHT }}>
              <ThemedText style={{ textAlign: 'center', marginTop: 40 }}>
                {loading ? 'Loading posts...' : error ? 'Error loading posts' : 'No posts found'}
              </ThemedText>
              {!loading && (
                <Pressable
                  style={{
                    marginTop: 20,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                  }}
                  onPress={() => createPostSheetRef.current?.present()}
                >
                  <ThemedText style={{ color: '#fff' }}>Create a post</ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {error && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ color: 'red' }}>Error: {error}</ThemedText>
              <Pressable
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: '#3b82f6',
                  borderRadius: 8
                }}
                onPress={() => fetchPosts()}
              >
                <ThemedText style={{ color: '#fff' }}>Retry</ThemedText>
              </Pressable>
            </View>
          )}
        </Animated.ScrollView>

        {/* Bottom Sheets */}
        <CommentBottomSheet ref={commentSheetRef} />
        <CreatePostBottomSheet ref={createPostSheetRef} onSuccess={handlePostSuccess} />
      </ScreenContainer>
    </PostBottomSheetsProvider>
  );
}