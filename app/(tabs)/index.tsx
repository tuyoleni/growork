import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';


import Header, { HEADER_HEIGHT } from '@/components/home/Header';
import ScreenContainer from '@/components/ScreenContainer';
import { useAuth, useHomeFeed } from '@/hooks';
import { ThemedText } from '@/components/ThemedText';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import ContentCard from '@/components/content/ContentCard';
import { PostType, UserType } from '@/types/enums';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';


const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Logistics',
  'Education', 'Design', 'Software', 'Entertainment',
  'E-commerce', 'Fintech', 'Automotive'
];

export default function Home() {
  const { profile } = useAuth();
  const [selectedContentType, setSelectedContentType] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState(-1);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);

  const {
    posts: cardPosts,
    loading,
    error,
    refresh: fetchPosts,
  } = useHomeFeed();

  const getIndustryLabel = (index: number) => INDUSTRIES[index] || '';
  const filteredPosts = useMemo(
    () =>
      cardPosts.filter((post) => {
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

  const handlePostSuccess = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  // --- SHEET OPENERS ---
  const { openCreatePostSheet, openJobApplicationSheet } = useBottomSheetManager({ onPostSuccess: handlePostSuccess });

  function handleShowCreatePost() {
    openCreatePostSheet();
  }



  function handleApplyToJob(post: any) {
    if (post.variant === 'job' && post.id) {
      const jobPost = {
        id: post.id,
        title: post.title,
        content: post.description,
        type: PostType.Job,
        user_id: post.user_id || '',
        created_at: post.createdAt || new Date().toISOString(),
        updated_at: null,
        image_url: post.mainImage || null,
        industry: post.industry || null,
        criteria: post.criteria || null,
        is_sponsored: false,
      };

      openJobApplicationSheet(jobPost, {
        onSuccess: () => {
          console.log('Application submitted successfully');
        }
      });
    }
  }

  if (loading && !cardPosts.length) {
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
            isBusinessUser={Boolean(profile?.user_type === UserType.Business)}
          />
        </Animated.View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        >
          {[1, 2, 3, 4, 5].map((index) => (
            <ContentCardSkeleton key={`skeleton-${index}`} />
          ))}
        </Animated.ScrollView>
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
          isBusinessUser={Boolean(profile?.user_type === UserType.Business)}
        />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: any, index: number) => (
            <ContentCard
              key={`${post.title}-${post.variant}-${index}-${post.id ?? 'unknown'}`}
              {...post}
              onPressApply={() => handleApplyToJob(post)}
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