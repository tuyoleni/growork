import React, { useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Document } from '@/types/documents';
import ContentCard from '@/components/content/ContentCard';
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
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  
  const { results, loading, error, search } = useSearch();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    search(term);
  };

  const handleFilterChange = (filter: FilterKey) => {
    setSelectedFilter(filter);
    if (searchTerm) {
      const postType = filter === 'jobs' ? PostType.Job : filter === 'news' ? PostType.News : undefined;
      search(searchTerm, postType, selectedIndustry || undefined);
    }
  };

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
      <SearchBar 
        value={searchTerm}
        onChange={handleSearch}
        onClear={() => {
          setSearchTerm('');
          search('');
        }}  
      />
      
      {searchTerm && (
        <>
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
        </>
      )}

      <SearchResults results={filteredResults} loading={loading} />
      
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        </ThemedView>
      )}
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
  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (results.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedView style={[styles.iconCircle, { backgroundColor: backgroundSecondary }]}>
          <Feather name="search" size={32} color={iconColor} />
        </ThemedView>
        <ThemedText type="subtitle" style={styles.noResultsTitle}>No results found</ThemedText>
        <ThemedText style={[styles.noResultsSub, { color: mutedTextColor }]}>
          Try adjusting your search terms or filters to find what you're looking for
        </ThemedText>
      </ThemedView>
    );
  }

  // Split results into posts and documents for display groups if you want group headers
  const postResults = results.filter(
    item => item._type === 'post'
  ) as (PostWithProfile & { _type: 'post' })[];
  const documentResults = results.filter(
    item => item._type === 'document'
  ) as (Document & { _type: 'document' })[];

  return (
    <ThemedView>
      {postResults.length > 0 && (
        <FlatList
          data={postResults}
          keyExtractor={(item, index) => `post-${item.id || index}`}
          renderItem={({ item }) => (
            <ThemedView style={[styles.itemContainer, { borderBottomColor: borderColor }]}>
              <PostResultItem post={item} />
            </ThemedView>
          )}
        />
      )}

      {documentResults.length > 0 && postResults.length > 0 && (
        <ThemedView style={[styles.sectionHeader, { backgroundColor: backgroundSecondary, borderColor }]}>
          <ThemedText style={[styles.sectionHeaderText, { color: mutedTextColor }]}>Your Documents</ThemedText>
        </ThemedView>
      )}

      {documentResults.length > 0 && (
        <FlatList
          data={documentResults}
          keyExtractor={(item, index) => `document-${item.id || index}`}
          renderItem={({ item }) => (
            <ThemedView style={[styles.itemContainer, { borderBottomColor: borderColor }]}>
              <DocumentResultItem document={item} />
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
}

function PostResultItem({ post }: { post: PostWithProfile & { _type: 'post' } }) {
  // Card variant: job or news
  const cardVariant =
    post.type === PostType.Job ? 'job' : 'news';

  // Profile fields (may be undefined/null)
  const profile = post.profiles;
  const username = profile?.username || '';
  const name = [profile?.name, profile?.surname].filter(Boolean).join(' ') || '';
  const avatarImage =
    profile?.avatar_url ||
    (post.criteria?.company
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(post.criteria.company)}&background=random`
      : 'https://via.placeholder.com/32');

  // Title for the company/user/author/publisher
  const displayTitle =
    cardVariant === 'job'
      ? post.criteria?.company || post.title || ''
      : profile?.name ||
        post.criteria?.author ||
        post.criteria?.source ||
        'Publisher';

  // Main post title/headline
  const postTitle = post.title || '';
  const description = post.content || '';

  return (
    <ContentCard
      variant={cardVariant}
      id={post.id}
      title={displayTitle}
      postTitle={postTitle}
      username={username}
      name={name}
      avatarImage={avatarImage}
      mainImage={post.image_url ?? undefined}
      description={description}
      badgeText={
        cardVariant === 'job'
          ? post.criteria?.location || 'Remote'
          : cardVariant === 'news'
          ? post.criteria?.source || 'News'
          : undefined
      }
      badgeVariant={cardVariant === 'news' ? 'error' : undefined}
      isVerified={false} // profile.verified is not present; if you add it, use profile?.verified
      industry={post.industry || undefined}
      onPressHeart={() => {}}
      onPressBookmark={() => {}}
      onPressShare={() => {}}
      onPressApply={() => {}}
      jobId={post.id}
    />
  );
}
  
function DocumentResultItem({ document }: { document: Document & { _type: 'document' } }) {
  return <DocumentCard document={document} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    textAlign: 'center',
  },
  iconCircle: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  noResultsTitle: {
    marginBottom: 8,
  },
  noResultsSub: {
    fontSize: 14,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
  },
});
