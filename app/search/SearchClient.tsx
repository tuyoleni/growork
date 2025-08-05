'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useDocuments } from '@/hooks/useDocuments';
import { Post, Document, PostType } from '@/types';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import IndustryFilter from './components/IndustryFilter';
import SearchResults from './components/SearchResults';
import { 
  FILTER_OPTIONS, 
  FilterKey,
  filterPostsByType,
  filterPostsByIndustry,
  filterPostsBySearchTerm,
  filterDocumentsBySearchTerm
} from './config';

export type SearchResult =
  | (Post & { _type: 'post' })
  | (Document & { _type: 'document' });

export default function SearchClient() {
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

  // Merge and filter results based on search query and filters
  const mergedResults: SearchResult[] = useMemo(() => {
    // Apply type filter
    let filteredPosts = selectedFilter === 'all'
      ? posts
      : filterPostsByType(
          posts, 
          selectedFilter === 'jobs' ? PostType.Job : PostType.News
        );
    
    // Apply industry filter
    if (industryFilter && industryFilter !== 'All') {
      filteredPosts = filterPostsByIndustry(filteredPosts, industryFilter);
    }

    // Apply search filter to posts
    if (search.trim()) {
      filteredPosts = filterPostsBySearchTerm(filteredPosts, search);
    }

    // Filter and search documents
    let filteredDocs = documents.filter(doc => doc.user_id === currentUserId);
    if (search.trim()) {
      filteredDocs = filterDocumentsBySearchTerm(filteredDocs, search);
    }

    // Combine results based on selected filter
    if (selectedFilter === 'all') {
      return [
        ...filteredPosts.map(p => ({ ...p, _type: 'post' as const })),
        ...filteredDocs.map(d => ({ ...d, _type: 'document' as const }))
      ];
    }
    
    return filteredPosts.map(p => ({ ...p, _type: 'post' as const }));
  }, [posts, documents, selectedFilter, currentUserId, search, industryFilter]);

  // Calculate counts for each filter tab
  const counts = useMemo(
    () => ({
      all: posts.length + documents.filter(d => d.user_id === currentUserId).length,
      jobs: posts.filter(p => p.type === PostType.Job).length,
      news: posts.filter(p => p.type === PostType.News).length,
    }),
    [posts, documents, currentUserId]
  );

  const clearSearch = useCallback(() => setSearch(''), []);
  const loading = postsLoading || docsLoading;

  // Handle industry selection
  const handleIndustryChange = useCallback((industry: string) => {
    setIndustryFilter(industry === 'All' ? null : industry);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        {/* Search Bar */}
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          onClear={clearSearch} 
          placeholder="Search companies, jobs, news, and your documents..."
        />
        
        {/* Filter Tabs */}<FilterTabs
            options={FILTER_OPTIONS}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            counts={counts}
          />
        
        {/* Industry Filter */}
        <IndustryFilter
          selectedIndustry={industryFilter}
          setSelectedIndustry={handleIndustryChange}
        />
      </div>
      
      {/* Search Results with more efficient scroll handling */}
      <div className="flex-1 overflow-auto">
        <SearchResults 
          results={mergedResults} 
          loading={loading} 
        />
      </div>
    </div>
  );
}