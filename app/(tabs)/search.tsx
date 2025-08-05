import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Post, Document, PostType } from '@/types';
import { usePosts } from '@/hooks/usePosts';
import { useDocuments } from '@/hooks/useDocuments';
import ContentCard from '@/components/content/ContentCard';
import DocumentCard from '@/components/content/DocumentCard';
import { useAuth } from '@/hooks/useAuth'; // adjust path if necessary
import ScreenContainer from '@/components/ScreenContainer';




const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'news', label: 'News' },
] as const;
type FilterKey = typeof FILTER_OPTIONS[number]['key'];

// You may want to import this from your industries config
const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Logistics',
  'Education',
];

type SearchResult =
  | (Post & { _type: 'post' })
  | (Document & { _type: 'document' });

  export default function SearchScreen() {
    const { user } = useAuth();
    const currentUserId = user?.id || "";  
    const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);


  const { posts, loading: postsLoading, fetchPosts } = usePosts();
  const { documents, loading: docsLoading, fetchDocuments } = useDocuments(currentUserId);

  // Fetch data on filter change
  useEffect(() => {
    if (selectedFilter === 'jobs') {
      fetchPosts(PostType.Job, industryFilter ?? undefined);
    } else if (selectedFilter === 'news') {
      fetchPosts(PostType.News, industryFilter ?? undefined);
    } else {
      fetchPosts(undefined, industryFilter ?? undefined);
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, industryFilter, currentUserId]);

  // Merge and filter results
  const mergedResults: SearchResult[] = useMemo(() => {
    let filteredPosts =
      selectedFilter === 'jobs'
        ? posts.filter((p) => p.type === PostType.Job)
        : selectedFilter === 'news'
        ? posts.filter((p) => p.type === PostType.News)
        : posts;

    if (industryFilter) {
      filteredPosts = filteredPosts.filter(
        (p) => (p.industry || '').toLowerCase() === industryFilter.toLowerCase()
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      filteredPosts = filteredPosts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.content && p.content.toLowerCase().includes(q)) ||
          (p.criteria?.company && p.criteria.company.toLowerCase().includes(q)) ||
          (p.criteria?.location && p.criteria.location.toLowerCase().includes(q)) ||
          (p.industry && p.industry.toLowerCase().includes(q))
      );
    }

    let filteredDocs = documents.filter((doc) => doc.user_id === currentUserId);
    if (q) {
      filteredDocs = filteredDocs.filter(
        (d) =>
          (d.name && d.name.toLowerCase().includes(q)) ||
          d.type.toLowerCase().includes(q)
      );
    }

    if (selectedFilter === 'all') {
      return [
        ...filteredPosts.map((p) => ({ ...p, _type: 'post' as const })),
        ...filteredDocs.map((d) => ({ ...d, _type: 'document' as const })),
      ];
    }
    return filteredPosts.map((p) => ({ ...p, _type: 'post' as const }));
  }, [posts, documents, selectedFilter, currentUserId, search, industryFilter]);

  const counts: Record<FilterKey, number> = useMemo(
    () => ({
      all: posts.length + documents.filter((d) => d.user_id === currentUserId).length,
      jobs: posts.filter((p) => p.type === PostType.Job).length,
      news: posts.filter((p) => p.type === PostType.News).length,
    }),
    [posts, documents, currentUserId]
  );

  const renderItem = useCallback(({ item }: { item: SearchResult }) => {
    if (item._type === 'post') {
      const post = item as Post;
      const cardVariant =
        post.type === PostType.Job
          ? 'job'
          : post.type === PostType.News
          ? 'news'
          : 'news';
      // Safe access for cards (all props expected by ContentCard)
      return (
        <View >
          <ContentCard
            variant={cardVariant}
            id={post.id}
            title={post.criteria?.company || post.title || ''}
            avatarImage={''}
            mainImage={post.image_url ?? undefined}
            description={post.content ?? post.title ?? ''}
            badgeText={
              cardVariant === 'job'
                ? post.criteria?.location || 'Remote'
                : cardVariant === 'news'
                ? post.criteria?.source || 'News'
                : undefined
            }
            badgeVariant={cardVariant === 'news' ? 'error' : undefined}
            isVerified={false} // update if profile relations are implemented
            industry={post.industry || undefined}
            onPressHeart={() => {}}
            onPressBookmark={() => {}}
            onPressShare={() => {}}
            onPressApply={() => {}}
            jobId={post.id}
          />
        </View>
      );
    } else {
      const doc = item as Document;
      return (
        <View style={styles.itemContainer}>
          <DocumentCard document={doc} />
        </View>
      );
    }
  }, []);

  const clearSearch = () => setSearch('');
  const loading = postsLoading || docsLoading;

  return (
    <ScreenContainer>
      {/* Search + Filter Bar */}
      <View style={styles.topBar}>
        {/* Search Field */}
        <View style={styles.searchField}>
          <Feather name="search" size={22} color="#A0A0A0" style={{ marginLeft: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Search companies, jobs, news, and your documents..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#A0A0A0"
          />
          {!!search && (
            <TouchableOpacity onPress={clearSearch}>
              <Feather name="x-circle" size={22} color="#A0A0A0" style={{ marginRight: 8 }} />
            </TouchableOpacity>
          )}
        </View>
        {/* Toggle Group */}
        <View style={styles.toggleGroup}>
          {FILTER_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setSelectedFilter(f.key)}
              style={[
                styles.toggleItem,
                selectedFilter === f.key && styles.toggleItemSelected,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  selectedFilter === f.key && styles.toggleTextSelected,
                ]}
              >
                {f.label} {counts[f.key] > 0 ? counts[f.key] : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Industry Filter */}
        <View style={styles.industryFilterGroup}>
          <FlatList
            data={['All', ...INDUSTRY_OPTIONS]}
            horizontal
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setIndustryFilter(item === 'All' ? null : item)}
                style={[
                  styles.industryItem,
                  item === (industryFilter ?? 'All') && styles.industryItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.industryText,
                    item === (industryFilter ?? 'All') && styles.industryTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
      {/* Results */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={mergedResults}
            keyExtractor={(item, idx) =>
              item._type === 'document'
                ? (item as Document).id
                : (item as Post).id || `${idx}`
            }
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#EFF2FA',
    marginBottom: 10,
    paddingVertical: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111',
    backgroundColor: 'transparent',
  },
  toggleGroup: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  toggleItem: {
    marginRight: 14,
    backgroundColor: '#EFF2FA',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  toggleItemSelected: {
    backgroundColor: '#2563EB',
  },
  toggleText: {
    color: '#777',
    fontWeight: '600',
  },
  toggleTextSelected: {
    color: '#fff',
  },
  itemContainer: {
    borderBottomColor: '#DFE3E8',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  industryFilterGroup: { flexDirection: 'row', marginTop: 4 },
  industryItem: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#EFF2FA',
    marginRight: 8,
  },
  industryItemSelected: {
    backgroundColor: '#2563EB',
  },
  industryText: {
    color: '#777',
    fontWeight: '500',
    fontSize: 13,
  },
  industryTextSelected: {
    color: '#fff',
  },
});
