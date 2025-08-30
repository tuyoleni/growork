import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Post } from "@/types/posts";
import { Document } from "@/types/documents";
import { Profile } from "@/types/profile";
import DocumentCard from "@/components/content/DocumentCard";
import { Feather } from "@expo/vector-icons";
import { PostType } from "@/types";
import ScreenContainer from "@/components/ScreenContainer";
import { useBottomSheetManager } from "@/components/content/BottomSheetManager";
import { SearchResultsSkeleton } from "@/components/ui/Skeleton";
import ContentCard from "@/components/content/ContentCard";
import { useInteractions } from "@/hooks/posts/useInteractions";

interface PostWithProfile extends Post {
  profiles?: Profile | null;
}

interface SearchResultsProps {
  results:
    | (PostWithProfile & { _type: "post" })[]
    | (Document & { _type: "document" })[];
  loading: boolean;
}

export default function SearchResults({
  results,
  loading,
}: SearchResultsProps) {
  const { initializePosts } = useInteractions();
  if (loading) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.iconCircle}>
          <Feather name="search" size={32} color="#9ca3af" />
        </View>
        <Text style={styles.noResultsTitle}>No results found</Text>
        <Text style={styles.noResultsSub}>
          Try adjusting your search terms or filters to find what you are
          looking for
        </Text>
      </View>
    );
  }

  const postResults = results.filter(
    (item) => item._type === "post"
  ) as (PostWithProfile & { _type: "post" })[];
  React.useEffect(() => {
    const ids = postResults.map((p) => p.id as string).filter(Boolean);
    if (ids.length) initializePosts(ids);
  }, [postResults, initializePosts]);
  const documentResults = results.filter(
    (item) => item._type === "document"
  ) as (Document & { _type: "document" })[];

  return (
    <ScreenContainer>
      {postResults.length > 0 && (
        <FlatList
          data={postResults}
          keyExtractor={(item, index) => `post-${item.id || index}`}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <PostResultItem post={item} />
            </View>
          )}
        />
      )}

      {documentResults.length > 0 && postResults.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Your Documents</Text>
        </View>
      )}

      {documentResults.length > 0 && (
        <FlatList
          data={documentResults}
          keyExtractor={(item, index) => `document-${item.id || index}`}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <DocumentResultItem document={item} />
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

function PostResultItem({ post }: { post: PostWithProfile }) {
  const { openJobApplicationSheet } = useBottomSheetManager();
  const cardVariant = post.type === PostType.Job ? "job" : "news";

  // Use description/content if available
  const description = post.content || "";

  // Validate and get main image
  const getMainImage = () => {
    if (!post.image_url || post.image_url.trim() === "") {
      return undefined;
    }

    // Basic URL validation
    try {
      new URL(post.image_url);
      return post.image_url;
    } catch {
      return undefined;
    }
  };

  const mainImage = getMainImage();

  // Author props from profile
  const authorName = post.profiles
    ? `${post.profiles.name ?? ""}${
        post.profiles.surname ? " " + post.profiles.surname : ""
      }`.trim()
    : undefined;
  const authorAvatarUrl = post.profiles?.avatar_url || undefined;

  const handleApplyToJob = () => {
    if (post.type === PostType.Job) {
      openJobApplicationSheet(post, {
        onSuccess: () => {
          console.log("Application submitted successfully");
        },
      });
    }
  };

  return (
    <ContentCard
      variant={cardVariant}
      id={post.id}
      title={post.title || ""}
      description={description}
      mainImage={mainImage}
      createdAt={post.created_at}
      criteria={post.criteria || undefined}
      onPressApply={handleApplyToJob}
      user_id={post.user_id}
      authorName={authorName}
      authorAvatarUrl={authorAvatarUrl}
    />
  );
}

function DocumentResultItem({ document }: { document: Document }) {
  return (
    <DocumentCard document={document} variant="detailed" showCategory={true} />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    textAlign: "center",
  },
  iconCircle: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  noResultsTitle: {
    color: "#4b5563",
    fontSize: 18,
    fontWeight: "500",
  },
  noResultsSub: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 8,
    maxWidth: 300,
    textAlign: "center",
  },
  itemContainer: {
    padding: 16,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
});
