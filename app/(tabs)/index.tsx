import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import ContentCard from '@/components/content/ContentCard';
import Header, { HEADER_HEIGHT } from '@/components/home/Header';
import ScreenContainer from '@/components/ScreenContainer';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  useFeedPosts,
  ExtendedContentCardProps,
} from '@/hooks/useFeedPosts';
import { ThemedText } from '@/components/ThemedText';
import { openGlobalSheet } from '@/utils/globalSheet';
import CreatePostSheetUI from '@/components/content/CreatePost';
import Comments from '@/components/content/Comment';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Logistics',
  'Education', 'Design', 'Software', 'Entertainment',
  'E-commerce', 'Fintech', 'Automotive'
];

export default function Home() {
  const [selectedContentType, setSelectedContentType] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState(-1);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);

  // Data from feed posts hook
  const {
    posts: dbPosts,
    loading,
    error,
    refreshing,
    fetchPosts,
    convertDbPostToContentCard,
  } = useFeedPosts();

  // Convert all dbPosts to UI card props
  const cardPosts = useMemo(
    () => dbPosts.map(convertDbPostToContentCard),
    [dbPosts, convertDbPostToContentCard]
  );

  // UI filtering on card posts
  const getIndustryLabel = (index: number) => INDUSTRIES[index] || '';
  const filteredPosts = useMemo(
    () =>
      cardPosts.filter((post: ExtendedContentCardProps) => {
        if (post.variant === 'sponsored') return true;
        if (selectedContentType === 1 && post.variant !== 'job') return false;
        if (selectedContentType === 2 && post.variant !== 'news') return false;
        if (selectedIndustry !== -1) {
          const selectedIndustryLabel = getIndustryLabel(selectedIndustry);
          if (post.industry !== selectedIndustryLabel) return false;
        }
        return true;
      }),
    [cardPosts, selectedContentType, selectedIndustry]
  );

  // Animated header show/hide logic
  const [headerVisible, setHeaderVisible] = useState(true);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    if (y < 40) {
      lastScrollY.current = y;
      return;
    }
    if (diff > 10 && !isAnimating.current && headerVisible) {
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
      }, 300);
    }
    lastScrollY.current = y;
  };

  const textColor = useThemeColor({}, 'text');
  const handlePostSuccess = () => fetchPosts();

  // --- SHEET OPENERS ---
  function handleShowCreatePost() {
    openGlobalSheet({
      header: <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Create Post</ThemedText>,
      body: <CreatePostSheetUI onSuccess={handlePostSuccess} />,
      snapPoints: ['90%'],
    });
  }
  function handleShowComments(postId: string) {
    openGlobalSheet({
      header: <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Comments</ThemedText>,
      body: <Comments postId={postId} />,
      snapPoints: ['80%'],
    });
  }

  function handleShare(post: ExtendedContentCardProps) {
    Share.share({
      message: post.description || post.title || 'Check out this post!',
      title: post.title || 'Growork Post',
      url: post.mainImage || undefined,
    });
  }

  if (loading && !dbPosts.length) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Sticky/animated header */}
      <Animated.View style={{
        transform: [{ translateY: headerAnim }],
        zIndex: 10,
        position: 'absolute',
        top: 0, left: 0, right: 0,
      }}>
        <Header
          selectedContentType={selectedContentType}
          onContentTypeChange={setSelectedContentType}
          selectedIndustry={selectedIndustry}
          onIndustryChange={setSelectedIndustry}
          onAddPost={handleShowCreatePost}
        />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <ContentCard
              key={`${post.title}-${post.variant}-${index}-${post.id ?? 'unknown'}`}
              {...post}
              onCommentPress={() => handleShowComments(post.id!)}
              onPressShare={() => handleShare(post)}
              style={index === 0 ? { marginTop: HEADER_HEIGHT - 48 } : undefined}
            />
          ))
        ) : (
          <View style={{ flex: 1, padding: 20, alignItems: 'center', marginTop: HEADER_HEIGHT }}>
            <ThemedText style={{ textAlign: 'center', marginTop: 40 }}>
              {loading
                ? 'Loading posts...'
                : error
                  ? 'Error loading posts'
                  : 'No posts found'}
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
                onPress={handleShowCreatePost}
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
    </ScreenContainer>
  );
}
