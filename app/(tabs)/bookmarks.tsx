import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import ContentCard from "@/components/content/ContentCard";
import { useBookmarks } from "@/hooks";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/ScreenContainer";
import { useInteractions } from "@/hooks/posts/useInteractions";
import { PostSkeleton } from "@/components/ui/SkeletonLoader";
import CategorySelector from "@/components/ui/CategorySelector";
import UniversalHeader from "@/components/ui/UniversalHeader";
export default function Bookmarks() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState(0);
  const { bookmarkedItems, loading, error, refreshBookmarks } = useBookmarks();
  const { initializePost } = useInteractions();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Convert bookmarked posts to the same format as home feed
  const allBookmarkedPosts = useMemo(() => {
    return bookmarkedItems
      .filter((item) => item.type === "post")
      .map((item) => {
        const post = item.data;
        return {
          id: post.id,
          variant: post.type === "job" ? "job" : "news",
          title: post.title,
          description: post.content,
          mainImage: post.image_url,
          user_id: post.user_id,
          criteria: post.criteria,
          createdAt: post.created_at,
          industry: post.criteria?.industry || post.industry,
        };
      });
  }, [bookmarkedItems]);

  // Apply content type filtering only
  const filteredPosts = useMemo(() => {
    return allBookmarkedPosts.filter((post) => {
      if (selectedContentType === 1 && post.variant !== "job") return false;
      if (selectedContentType === 2 && post.variant !== "news") return false;
      return true;
    });
  }, [allBookmarkedPosts, selectedContentType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBookmarks();
    } finally {
      setRefreshing(false);
    }
  }, [refreshBookmarks]);

  const handlePostPress = useCallback(
    (post: any) => {
      router.push(`/post/${post.id}`);
    },
    [router]
  );

  const handleApplyToJob = useCallback((post: any) => {
    // Handle job application logic
    console.log("Apply to job:", post.id);
  }, []);

  // Initialize interactions for all bookmarked posts (not just filtered)
  const allPostIds = useMemo(
    () => allBookmarkedPosts.map((p) => p.id).filter(Boolean),
    [allBookmarkedPosts]
  );
  React.useEffect(() => {
    if (allPostIds.length) {
      // Use batch initialization for better performance
      allPostIds.forEach((postId) => initializePost(postId));
    }
  }, [allPostIds.join(","), initializePost]);

  const renderPost = useCallback(
    ({ item: post }: { item: any }) => (
      <ContentCard
        key={post.id}
        id={post.id}
        variant={post.variant}
        title={post.title}
        description={post.description}
        mainImage={post.mainImage}
        user_id={post.user_id}
        criteria={post.criteria}
        createdAt={post.createdAt}
        onPressApply={() => handleApplyToJob(post)}
      />
    ),
    [handleApplyToJob]
  );

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      <UniversalHeader
        title="Bookmarks"
        showBackButton={false}
        showNotifications={false}
      />

      <CategorySelector
        selectedIndex={selectedContentType}
        onChange={setSelectedContentType}
        options={["All", "Jobs", "News"]}
      />

      <FlatList
        data={filteredPosts}
        keyExtractor={(post) => post.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8 }}
        ListHeaderComponent={
          loading ? (
            <ThemedView style={styles.loadingContainer}>
              {[1, 2, 3].map((index) => (
                <PostSkeleton key={`bookmark-skeleton-${index}`} />
              ))}
            </ThemedView>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {allBookmarkedPosts.length === 0
                  ? "No bookmarks yet"
                  : "No bookmarks match your filters"}
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                {allBookmarkedPosts.length === 0
                  ? "Bookmark posts to save them for later"
                  : "Try adjusting your content type or industry filters"}
              </ThemedText>
            </ThemedView>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    loadingContainer: {
      paddingHorizontal: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 64,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      opacity: 0.7,
      textAlign: "center",
      paddingHorizontal: 32,
    },
  });
