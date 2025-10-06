import React, { useState, useCallback } from "react";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  PostWithProfile,
  SearchResult,
  useSearch,
  useThemeColor,
} from "@/hooks";
import SearchBar from "./components/SearchBar";
import FilterTabs from "./components/FilterTabs";
import IndustryFilter from "./components/IndustryFilter";
import { FilterKey } from "@/constants/searchConfig";
import { PostType } from "@/types/enums";
import ScreenContainer from "@/components/ScreenContainer";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import ContentCard from "@/components/content/ContentCard";
import { useBottomSheetManager } from "@/components/content/BottomSheetManager";
import { SearchResultsSkeleton } from "@/components/ui/Skeleton";

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { results, loading, error, search } = useSearch();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (searchTerm) {
        await search(searchTerm);
      }
    } finally {
      setRefreshing(false);
    }
  }, [searchTerm, search]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    search(term);
  };

  // const handleFilterChange = (filter: FilterKey) => {
  //   setSelectedFilter(filter);
  //   if (searchTerm) {
  //     const postType = filter === 'jobs' ? PostType.Job : filter === 'news' ? PostType.News : undefined;
  //     search(searchTerm, postType, selectedIndustry || undefined);
  //   }
  // };

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry === "All" ? null : industry);
    if (searchTerm) {
      const postType =
        selectedFilter === "jobs"
          ? PostType.Job
          : selectedFilter === "news"
            ? PostType.News
            : undefined;
      search(searchTerm, postType, industry === "All" ? undefined : industry);
    }
  };

  // Filter results based on selected filter
  const filteredResults = results.filter((result: SearchResult) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "jobs" && result._type === "post")
      return result.type === PostType.Job;
    if (selectedFilter === "news" && result._type === "post")
      return result.type === PostType.News;
    return false;
  });

  // Calculate counts for each filter
  const counts = {
    all: results.length,
    jobs: results.filter(
      (r: SearchResult) => r._type === "post" && r.type === PostType.Job
    ).length,
    news: results.filter(
      (r: SearchResult) => r._type === "post" && r.type === PostType.News
    ).length,
  };

  const filterOptions = [
    { key: "all" as FilterKey, label: "All" },
    { key: "jobs" as FilterKey, label: "Jobs" },
    { key: "news" as FilterKey, label: "News" },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
      >
        <ThemedView style={styles.header}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            onClear={() => {
              setSearchTerm("");
              search("");
            }}
          />
        </ThemedView>

        {searchTerm && (
          <ThemedView style={styles.filtersSection}>
            <FilterTabs
              options={filterOptions}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              counts={counts}
            />

            <IndustryFilter
              selectedIndustry={selectedIndustry}
              setSelectedIndustry={handleIndustryChange}
            />
          </ThemedView>
        )}

        <ThemedView style={styles.resultsSection}>
          <SearchResults results={filteredResults} loading={loading} />
        </ThemedView>

        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
}

function SearchResults({ results, loading }: SearchResultsProps) {
  const iconColor = useThemeColor({}, "iconSecondary");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");
  const mutedTextColor = useThemeColor({}, "mutedText");

  if (loading) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedView
          style={[styles.iconCircle, { backgroundColor: backgroundSecondary }]}
        >
          <Feather name="search" size={32} color={iconColor} />
        </ThemedView>
        <ThemedText style={styles.noResultsTitle}>No results found</ThemedText>
        <ThemedText style={[styles.noResultsSub, { color: mutedTextColor }]}>
          Try adjusting your search terms or filters to find what you are
          looking for
        </ThemedText>
      </ThemedView>
    );
  }

  // Filter results to only show posts
  const postResults = results.filter(
    (item) => item._type === "post"
  ) as (PostWithProfile & { _type: "post" })[];

  return (
    <ThemedView>
      {postResults.length > 0 && (
        <ThemedView style={styles.postsSection}>
          {postResults.map((item, index) => (
            <ThemedView
              key={`post-${item.id || index}`}
              style={styles.resultItem}
            >
              <PostResultItem post={item} />
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

function PostResultItem({
  post,
}: {
  post: PostWithProfile & { _type: "post" };
}) {
  const { openJobApplicationSheet } = useBottomSheetManager();
  // Card variant: job or news
  const cardVariant = post.type === PostType.Job ? "job" : "news";

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

  const handleApplyToJob = () => {
    if (post.type === PostType.Job) {
      openJobApplicationSheet(post, {
        onSuccess: () => {},
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
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsSection: {
    flex: 1,
  },

  postsSection: {
    gap: 12,
  },
  resultItem: {
    marginBottom: 12,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginVertical: 16,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 300,
  },
  iconCircle: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSub: {
    fontSize: 14,
    marginTop: 8,
    maxWidth: 300,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
  },
});
