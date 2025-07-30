import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Post, PostType } from '@/types';
import { Profile } from '@/types/profile';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, RefreshControl } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CommentBottomSheet from './CommentBottomSheet';
import CreatePostBottomSheet from './CreatePostBottomSheet';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import NewsCard from './NewsCard';
import JobCard from './JobCard';
import SponsoredCard from './SponsoredCard';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PostWithRelations extends Post {
  profiles?: Profile;
  likes?: Array<{ id: string; user_id: string }>;
  comments?: Array<{ id: string; user_id: string; content: string; created_at: string }>;
}

type PostFeedProps = {
  postType?: PostType;
  showTitle?: boolean;
  title?: string;
};

export default function PostFeed({
  postType,
  showTitle = false,
  title = 'Posts',
}: PostFeedProps) {
  // Refs for bottom sheets
  const commentSheetRef = useRef<BottomSheetModal>(null);
  const createPostSheetRef = useRef<BottomSheetModal>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { posts, loading, error, fetchPosts, likePost, unlikePost } = usePosts();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    fetchPosts(postType);
  }, [fetchPosts, postType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(postType);
    setRefreshing(false);
  };

  const handleLike = async (post: PostWithRelations) => {
    if (!user) return;
    
    // Check if user already liked the post
    const isLiked = post.likes?.some((like) => like.user_id === user.id);
    
    if (isLiked) {
      await unlikePost(post.id, user.id);
    } else {
      await likePost(post.id, user.id);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const post = item as PostWithRelations;
    const profile = post.profiles;
    
    switch (item.type) {
      case PostType.News:
        return (
          <NewsCard
            sourceName={profile?.name ? `${profile.name} ${profile.surname || ''}` : 'Anonymous'}
            sourceImage={profile?.avatar_url || 'https://via.placeholder.com/40'}
            badgeText="NEWS"
            badgeVariant="info"
            newsImage={item.image_url || 'https://via.placeholder.com/400'}
            headline={item.title || 'Untitled'}
            onPressHeart={() => handleLike(item)}
            onPressMessage={() => {
              setSelectedPost(item);
              commentSheetRef.current?.present();
            }}
            onPressShare={() => {}}
            onPressBookmark={() => {}}
            onPressMore={() => {}}
          />
        );
      case PostType.Job:
        // Use the correct JobCard props
        return (
          <JobCard
            companyName={profile?.name ? `${profile.name} ${profile.surname || ''}` : 'Anonymous'}
            companyImage={profile?.avatar_url || 'https://via.placeholder.com/40'}
            isVerified={true}
            jobDescription={item.content || 'No description provided.'}
            mainImage={item.image_url || 'https://via.placeholder.com/400'}
            onPressApply={() => {}}
          />
        );
      case PostType.Ad:
        // Use the correct SponsoredCard props
        return (
          <SponsoredCard
            companyName={profile?.name ? `${profile.name} ${profile.surname || ''}` : 'Anonymous'}
            companyImage={profile?.avatar_url || 'https://via.placeholder.com/40'}
            badgeText="Sponsored"
            adImage={item.image_url || 'https://via.placeholder.com/400'}
            description={item.content || 'No content provided.'}
            onPressHeart={() => handleLike(post)}
            onPressShare={() => {}}
            onPressMore={() => {}}
            onPressLearnMore={() => {}}
          />
        );
      default:
        return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </View>
    );
  }

  const handleCreatePost = () => {
    createPostSheetRef.current?.present();
  };

  return (
    <ThemedView style={styles.container}>
      {showTitle && title && (
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title} type="defaultSemiBold">{title}</ThemedText>
          <Pressable style={styles.createButton} onPress={handleCreatePost}>
            <Feather name="plus" size={20} color="white" />
          </Pressable>
        </View>
      )}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>No posts available</ThemedText>
          </View>
        }
      />
      
      <CommentBottomSheet 
        ref={commentSheetRef} 
      />
      
      <CreatePostBottomSheet 
        ref={createPostSheetRef}
        onSuccess={() => fetchPosts(postType)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});