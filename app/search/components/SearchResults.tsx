'use client';

import React from 'react';
import { Post, PostType, Document } from '@/types';
import ContentCard from '@/components/content/ContentCard';
import DocumentCard from '@/components/content/DocumentCard';
import { SearchResult } from '../SearchClient';
import { FileQuestion, Loader2, Search } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg font-medium">No results found</p>
        <p className="text-gray-400 text-sm mt-2 max-w-md">
          Try adjusting your search terms or filters to find what you're looking for
        </p>
      </div>
    );
  }

  // Group results by type for better organization
  const postResults = results.filter(item => item._type === 'post') as (Post & { _type: 'post' })[];
  const documentResults = results.filter(item => item._type === 'document') as (Document & { _type: 'document' })[];

  return (
    <div>
      {/* Posts Section */}
      {postResults.length > 0 && (
        <div className="divide-y divide-gray-200">
          {postResults.map((post, index) => (
            <div key={`post-${post.id || index}`} className="p-4">
              <PostResultItem post={post} />
            </div>
          ))}
        </div>
      )}

      {/* Documents Section - only show if we have both types of results */}
      {documentResults.length > 0 && postResults.length > 0 && (
        <div className="pt-4 pb-2 px-4 bg-gray-50 border-t border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Your Documents</h3>
        </div>
      )}

      {/* Document Results */}
      {documentResults.length > 0 && (
        <div className="divide-y divide-gray-200">
          {documentResults.map((document, index) => (
            <div key={`document-${document.id || index}`} className="p-4">
              <DocumentResultItem document={document} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostResultItem({ post }: { post: Post }) {
  const cardVariant = post.type === PostType.Job ? 'job' : 'news';
  
  return (
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
      isVerified={false}
      industry={post.industry || undefined}
      onPressHeart={() => {}}
      onPressBookmark={() => {}}
      onPressShare={() => {}}
      onPressApply={() => {}}
      jobId={post.id}
    />
  );
}

function DocumentResultItem({ document }: { document: Document }) {
  return <DocumentCard document={document} />;
}