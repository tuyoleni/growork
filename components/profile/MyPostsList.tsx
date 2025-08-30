import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { MyPostCard } from "@/components/content/MyPostCard";
import { useAuth, useMyPosts, useThemeColor } from "@/hooks";
import { deletePost } from "@/hooks/posts/usePostOperations";
import { useBottomSheetManager } from "@/components/content/BottomSheetManager";
import { PostWithProfile } from "@/hooks/posts";

// Extend PostWithProfile with properties needed by MyPostCard
interface MyPost extends PostWithProfile {
  is_active: boolean;
  applications_count: number;
}

export default function MyPostsList() {
  const { user } = useAuth();

  const { openCreatePostSheet } = useBottomSheetManager({
    onPostSuccess: () => {
      if (user) {
        refreshPosts();
      }
    },
  });

  const {
    posts,
    loading,
    error,
    refresh: refreshPosts,
  } = useMyPosts(user?.id || "");

  const textColor = useThemeColor({}, "text");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const tintColor = useThemeColor({}, "tint");

  const handlePostStatusUpdate = async (
    postId: string,
    status: "active" | "inactive"
  ) => {
    // TODO: Implement post status update functionality
    console.log("Update post status:", postId, status);
    Alert.alert("Info", "Post status update functionality coming soon");
  };

  const handlePostDelete = async (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await deletePost(postId);
              if (error) {
                Alert.alert(
                  "Error",
                  "Failed to delete post. Please try again."
                );
              } else {
                // Refresh the posts list
                refreshPosts();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete post. Please try again.");
            }
          },
        },
      ]
    );
  };

  const renderPostItem = ({ item }: { item: PostWithProfile }) => {
    // Cast to MyPost type with default values for missing properties
    const myPost: MyPost = {
      ...item,
      is_active: true, // Default to active - TODO: get from actual post data
      applications_count: 0, // Default to 0 - TODO: get from actual application count
    };

    return (
      <MyPostCard
        post={myPost}
        onStatusUpdate={handlePostStatusUpdate}
        onDelete={handlePostDelete}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
          Loading your posts...
        </ThemedText>
      </View>
    );
  }

  // If there are no posts, show empty state
  if (posts.length === 0)
    return (
      <View style={styles.centerContainer}>
        <Feather name="file-text" size={48} color={mutedTextColor} />
        <ThemedText
          style={[styles.emptyTitle, { color: textColor, marginTop: 16 }]}
        >
          No Posts Yet
        </ThemedText>
        <ThemedText
          style={[
            styles.emptyDescription,
            { color: mutedTextColor, marginTop: 8 },
          ]}
        >
          You haven&apos;t created any posts yet.
        </ThemedText>
        <Pressable
          style={[
            styles.createPostButton,
            { backgroundColor: tintColor, marginTop: 16 },
          ]}
          onPress={() => openCreatePostSheet()}
        >
          <ThemedText style={styles.createPostButtonText}>
            Create Your First Post
          </ThemedText>
        </Pressable>
      </View>
    );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color="#FF3B30" />
        <ThemedText style={[styles.errorText, { color: textColor }]}>
          Error loading posts
        </ThemedText>
        <ThemedText style={[styles.errorSubtext, { color: mutedTextColor }]}>
          {error}
        </ThemedText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tintColor }]}
          onPress={refreshPosts}
        >
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listContent}>
        {posts.map((item) => (
          <View key={item.id}>{renderPostItem({ item })}</View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  createPostButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createPostButtonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
