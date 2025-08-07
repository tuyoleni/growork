import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Document } from '@/types/documents';
import DocumentCard from '@/components/content/DocumentCard';
import { Feather } from '@expo/vector-icons';
import { PostWithProfile } from '@/hooks/usePosts';
import { SearchResult, useSearch } from '@/hooks/useSearch';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import IndustryFilter from './components/IndustryFilter';
import { FilterKey } from '@/constants/searchConfig';
import { PostType } from '@/types/enums';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import ContentCard from '@/components/content/ContentCard';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const { results, loading, error, search } = useSearch();

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
    setSelectedIndustry(industry === 'All' ? null : industry);
    if (searchTerm) {
      const postType = selectedFilter === 'jobs' ? PostType.Job : selectedFilter === 'news' ? PostType.News : undefined;
      search(searchTerm, postType, industry === 'All' ? undefined : industry);
    }
  };

  // Filter results based on selected filter
  const filteredResults = results.filter(result => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'jobs' && result._type === 'post') return result.type === PostType.Job;
    if (selectedFilter === 'news' && result._type === 'post') return result.type === PostType.News;
    if (selectedFilter === 'documents' && result._type === 'document') return true;
    return false;
  });

  // Calculate counts for each filter
  const counts = {
    all: results.length,
    jobs: results.filter(r => r._type === 'post' && r.type === PostType.Job).length,
    news: results.filter(r => r._type === 'post' && r.type === PostType.News).length,
    documents: results.filter(r => r._type === 'document').length,
  };

  const filterOptions = [
    { key: 'all' as FilterKey, label: 'All' },
    { key: 'jobs' as FilterKey, label: 'Jobs' },
    { key: 'news' as FilterKey, label: 'News' },
    { key: 'documents' as FilterKey, label: 'Documents' },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.header}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            onClear={() => {
              setSearchTerm('');
              search('');
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
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'iconSecondary');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  if (loading) {
    return <SearchResultsSkeleton />;
  }

  if (results.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedView style={[styles.iconCircle, { backgroundColor: backgroundSecondary }]}>
          <Feather name="search" size={32} color={iconColor} />
        </ThemedView>
        <ThemedText style={styles.noResultsTitle}>No results found</ThemedText>
        <ThemedText style={[styles.noResultsSub, { color: mutedTextColor }]}>
          Try adjusting your search terms or filters to find what you are looking for
        </ThemedText>
      </ThemedView>
    );
  }

  // Split results into posts and documents for display groups
  const postResults = results.filter(
    item => item._type === 'post'
  ) as (PostWithProfile & { _type: 'post' })[];
  const documentResults = results.filter(
    item => item._type === 'document'
  ) as (Document & { _type: 'document' })[];

  return (
    <ThemedView>
      {postResults.length > 0 && (
        <ThemedView style={styles.postsSection}>
          {postResults.map((item, index) => (
            <ThemedView key={`post-${item.id || index}`} style={styles.resultItem}>
              <PostResultItem post={item} />
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {documentResults.length > 0 && postResults.length > 0 && (
        <ThemedView style={[styles.sectionHeader, { backgroundColor: backgroundSecondary }]}>
          <ThemedText style={[styles.sectionHeaderText, { color: mutedTextColor }]}>
            Your Documents
          </ThemedText>
        </ThemedView>
      )}

      {documentResults.length > 0 && (
        <ThemedView style={styles.documentsSection}>
          {documentResults.map((item, index) => (
            <ThemedView key={`document-${item.id || index}`} style={styles.resultItem}>
              <DocumentResultItem document={item} />
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

function PostResultItem({ post }: { post: PostWithProfile & { _type: 'post' } }) {
  const { openJobApplicationSheet } = useBottomSheetManager();
  // Card variant: job or news
  const cardVariant =
    post.type === PostType.Job ? 'job' : 'news';

  // Profile fields (may be undefined/null)
  const profile = post.profiles;
  const username = profile?.username || 'user';
  const name = [profile?.name, profile?.surname].filter(Boolean).join(' ') || 'User';

  // Generate avatar image with better fallbacks
  const getAvatarImage = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }

    // Generate avatar based on company name for jobs
    if (cardVariant === 'job' && post.criteria?.company) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(post.criteria.company)}&background=random&size=40`;
    }

    // Generate avatar based on user name
    if (name && name !== 'User') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=40`;
    }

    // Fallback to generic avatar
    return 'https://ui-avatars.com/api/?name=U&background=random&size=40';
  };

  const avatarImage = getAvatarImage();

  // Title for the company/user/author/publisher
  const displayTitle =
    cardVariant === 'job'
      ? post.criteria?.company || post.title || 'Company'
      : profile?.name ||
      post.criteria?.author ||
      post.criteria?.source ||
      'Publisher';

  // Main post title/headline
  const postTitle = post.title || '';
  const description = post.content || '';

  // Enhanced data
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;

  // Validate and get main image
  const getMainImage = () => {
    if (!post.image_url || post.image_url.trim() === '') {
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
        onSuccess: () => {
          console.log('Application submitted successfully');
        }
      });
    }
  };

  return (
    <ContentCard
      variant={cardVariant}
      id={post.id}
      title={displayTitle}
      postTitle={postTitle}
      username={username}
      name={name}
      avatarImage={avatarImage}
      mainImage={mainImage}
      description={description}
      badgeText={
        cardVariant === 'job'
          ? post.criteria?.location || 'Remote'
          : cardVariant === 'news'
            ? post.criteria?.source || 'News'
            : undefined
      }
      badgeVariant={cardVariant === 'news' ? 'error' : undefined}
      isVerified={false}
      industry={post.industry || undefined}
      onPressApply={handleApplyToJob}
      user_id={post.user_id}
      jobId={post.id}
      // Enhanced data fields
      likesCount={likesCount}
      commentsCount={commentsCount}
      createdAt={post.created_at}
      criteria={post.criteria}
      isSponsored={post.is_sponsored}
    />
  );
}

function DocumentResultItem({ document }: { document: Document & { _type: 'document' } }) {
  return <DocumentCard document={document} variant="detailed" showCategory={true} />;
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
  documentsSection: {
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
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSub: {
    fontSize: 14,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
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
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
});
