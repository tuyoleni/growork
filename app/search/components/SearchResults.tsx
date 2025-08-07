import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Post } from '@/types/posts';
import { Document } from '@/types/documents';
import { Profile } from '@/types/profile';
import ContentCard from '@/components/content/ContentCard';
import DocumentCard from '@/components/content/DocumentCard';
import { Feather } from '@expo/vector-icons';
import { PostType } from '@/types';
import ScreenContainer from '@/components/ScreenContainer';

interface PostWithProfile extends Post {
  profiles?: Profile | null;
}

interface SearchResultsProps {
  results: (PostWithProfile & { _type: 'post' })[] | (Document & { _type: 'document' })[];
  loading: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.iconCircle}>
          <Feather name="search" size={32} color="#9ca3af" />
        </View>
        <Text style={styles.noResultsTitle}>No results found</Text>
        <Text style={styles.noResultsSub}>
          Try adjusting your search terms or filters to find what you're looking for
        </Text>
      </View>
    );
  }

  const postResults = results.filter(item => item._type === 'post') as (PostWithProfile & { _type: 'post' })[];
  const documentResults = results.filter(item => item._type === 'document') as (Document & { _type: 'document' })[];

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
  const cardVariant = post.type === PostType.Job ? 'job' : 'news';

  // Compose post title (may be null for older posts)
  const postTitle = post.title || '';
  // Use description/content if available
  const description = post.content || '';
  // User profile if available
  const profile = post.profiles;

  // Compose avatar, username, name with better fallbacks
  const username = profile?.username || 'user';
  const name = (profile?.name || '') + (profile?.surname ? ` ${profile.surname}` : '') || 'User';
  
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

  // Title is usually company (job) or publisher/source (news)
  const displayTitle =
    cardVariant === 'job'
      ? post.criteria?.company || 'Company'
      : profile?.name ||
        post.criteria?.author ||
        post.criteria?.source ||
        'Publisher';

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
      // isVerified={!!profile?.verified}
      industry={post.industry || undefined}
      onPressHeart={() => { }}
      onPressBookmark={() => { }}
      onPressShare={() => { }}
      onPressApply={() => { }}
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

function DocumentResultItem({ document }: { document: Document }) {
  return <DocumentCard document={document} variant="detailed" showCategory={true} />;
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
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  noResultsTitle: {
    color: '#4b5563',
    fontSize: 18,
    fontWeight: '500',
  },
  noResultsSub: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 16,
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
});
