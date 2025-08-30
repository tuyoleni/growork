import React, { useMemo, useRef, useState, useCallback, memo } from "react";
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
  RefreshControl,
} from "react-native";

import Header, { HEADER_HEIGHT } from "@/components/home/Header";
import ScreenContainer from "@/components/ScreenContainer";
import { useAuth, useHomeFeed } from "@/hooks";
import { ThemedText } from "@/components/ThemedText";
import { useBottomSheetManager } from "@/components/content/BottomSheetManager";
import ContentCard from "@/components/content/ContentCard";
import { PostType, UserType } from "@/types/enums";
import { ContentCardSkeleton } from "@/components/ui/Skeleton";
import NewPostsIndicator from "@/components/ui/NewPostsIndicator";
import { useInteractions } from "@/hooks/posts/useInteractions";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Logistics",
  "Education",
  "Design",
  "Software",
  "Entertainment",
  "E-commerce",
  "Fintech",
  "Automotive",
];

export default function Home() {
  const { profile } = useAuth();
  const [selectedContentType, setSelectedContentType] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState(-1);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [lastPostCount, setLastPostCount] = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isAnimating = useRef(false);

  const { posts: cardPosts, loading, error, refresh } = useHomeFeed();
  const { initializePosts } = useInteractions();

  const getIndustryLabel = (index: number) => INDUSTRIES[index] || "";
  const filteredPosts = useMemo(
    () =>
      cardPosts.filter((post) => {
        if (selectedContentType === 1 && post.variant !== "job") return false;
        if (selectedContentType === 2 && post.variant !== "news") return false;
        if (selectedIndustry !== -1) {
          const selectedIndustryLabel = getIndustryLabel(selectedIndustry);
          if (post.industry !== selectedIndustryLabel) return false;
        }
        return true;
      }),
    [cardPosts, selectedContentType, selectedIndustry]
  );

  // Initialize likes/bookmarks in batch for current list
  const postIds = useMemo(
    () => filteredPosts.map((p: any) => p.id as string).filter(Boolean),
    [filteredPosts]
  );
  const postIdsKey = useMemo(() => postIds.join(","), [postIds]);
  React.useEffect(() => {
    if (postIds.length) initializePosts(postIds);
  }, [postIdsKey, initializePosts]);

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
    refresh();
  }, [refresh]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      // Small delay to ensure UI updates properly
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Check for new posts
  const checkForNewPosts = useCallback(() => {
    if (cardPosts.length > lastPostCount && lastPostCount > 0) {
      setHasNewPosts(true);
    }
    setLastPostCount(cardPosts.length);
  }, [cardPosts.length, lastPostCount]);

  // Update last post count when posts change
  React.useEffect(() => {
    checkForNewPosts();
  }, [cardPosts.length]);

  // Handle scroll to top to see new posts
  const handleScrollToTop = useCallback(() => {
    setHasNewPosts(false);
    // Scroll to top logic will be handled by the ScrollView
  }, []);

  // --- SHEET OPENERS ---
  const { openCreatePostSheet, openJobApplicationSheet } =
    useBottomSheetManager({ onPostSuccess: handlePostSuccess });

  function handleShowCreatePost() {
    openCreatePostSheet();
  }

  const handleApplyToJob = useCallback(
    (post: any) => {
      if (post.variant === "job" && post.id) {
        const jobPost = {
          id: post.id,
          title: post.title,
          content: post.description,
          type: PostType.Job,
          user_id: post.user_id || "",
          created_at: post.createdAt || new Date().toISOString(),
          updated_at: null,
          image_url: post.mainImage || null,
          industry: post.industry || null,
          criteria: post.criteria || null,
          is_sponsored: false,
        };

        openJobApplicationSheet(jobPost, {
          onSuccess: () => {
            console.log("Application submitted successfully");
          },
        });
      }
    },
    [openJobApplicationSheet]
  );

  if (loading && !cardPosts.length) {
    return (
      <ScreenContainer>
        {/* Sticky/animated header */}
        <Animated.View
          style={{
            transform: [{ translateY: headerAnim }],
            zIndex: 10,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
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
      <Animated.View
        style={{
          transform: [{ translateY: headerAnim }],
          zIndex: 10,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <Header
          selectedContentType={selectedContentType}
          onContentTypeChange={setSelectedContentType}
          selectedIndustry={selectedIndustry}
          onIndustryChange={setSelectedIndustry}
          onAddPost={handleShowCreatePost}
        />
      </Animated.View>

      {/* New Posts Indicator */}
      <NewPostsIndicator
        visible={hasNewPosts}
        onPress={handleScrollToTop}
        style={{ top: HEADER_HEIGHT + 20 }}
      />

      <Animated.FlatList
        data={filteredPosts}
        keyExtractor={(item, index) =>
          `${item.title}-${item.variant}-${index}-${item.id ?? "unknown"}`
        }
        renderItem={({ item, index }) => (
          <ContentCard
            {...item}
            onPressApply={() => handleApplyToJob(item)}
            style={index === 0 ? { marginTop: HEADER_HEIGHT - 48 } : undefined}
          />
        )}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
        getItemLayout={(data, index) => ({
          length: 300,
          offset: 300 * index,
          index,
        })}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
        contentContainerStyle={{ paddingTop: 0 }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              padding: 20,
              alignItems: "center",
              marginTop: HEADER_HEIGHT,
            }}
          >
            <ThemedText style={{ textAlign: "center", marginTop: 40 }}>
              {loading
                ? "Loading posts..."
                : error
                ? "Error loading posts"
                : "No posts found"}
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          error ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ThemedText
                style={{ color: "red", textAlign: "center", marginBottom: 12 }}
              >
                Error: {error}
              </ThemedText>
              <Pressable
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: "#007AFF",
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => refresh()}
                accessibilityLabel="Retry loading posts"
                accessibilityRole="button"
              >
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  Retry
                </ThemedText>
              </Pressable>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
