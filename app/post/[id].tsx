'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View as RNView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePosts as usePostById } from '@/hooks/usePostById';
import { usePosts as useFeedPosts } from '@/hooks/usePosts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';
import { Post } from '@/types';
import { PostType } from '@/types/enums';

import PostInteractionBar from '@/components/content/PostInteractionBar';
import ApplyButton from '@/components/content/post/ApplyButton';
import PostBadge from '@/components/content/post/PostBadge';
import { openGlobalSheet } from '@/utils/globalSheet';
import JobApplicationSheetContent from '@/components/content/JobApplicationSheetContent';

const ICON_SIZE = 20;

const PostDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const { loading: isLoading, getPostById } = usePostById();
  const { posts: allPosts, loading: feedLoading, fetchPosts } = useFeedPosts();

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const { data } = await getPostById(id as string);
        setPost(data);
        fetchPosts();
      }
    };
    fetchData();
  }, [id, getPostById, fetchPosts]);

  const recommendedPosts: Post[] =
    post && allPosts
      ? allPosts.filter(
        (p: Post) =>
          p.type === post.type &&
          p.id !== post.id
      )
      : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)} years ago`;
  };

  const handleSourcePress = () => {
    if (post?.criteria?.source) {
      Linking.openURL(post.criteria.source);
    }
  };

  if (isLoading || feedLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator color={tintColor} />
      </ThemedView>
    );
  }

  if (!post) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>Post not found</ThemedText>
      </ThemedView>
    );
  }

  const isJob = post.type === PostType.Job;
  const isNews = post.type === PostType.News;

  return (
    <ScreenContainer>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={ICON_SIZE} color={textColor} />
        </TouchableOpacity>
        <RNView style={styles.headerRightButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => console.log('Share pressed')}
            accessibilityLabel="Share"
          >
            <Feather name="share-2" size={ICON_SIZE} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => console.log('More options pressed')}
            accessibilityLabel="More options"
          >
            <Feather name="more-horizontal" size={ICON_SIZE} color={textColor} />
          </TouchableOpacity>
        </RNView>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.contentContainer}>
          {/* Post Type Badge */}
          <RNView style={styles.typeBadgeContainer}>
            <PostBadge
              label={isJob ? 'Job Posting' : 'News Article'}
              variant={isJob ? 'success' : 'default'}
              size="small"
            />
            {post.industry && (
              <PostBadge
                label={post.industry} size="small"
              />
            )}
          </RNView>

          {/* Title */}
          <ThemedText style={styles.postTitle}>{post.title}</ThemedText>

          {/* Image */}
          {post.image_url ? (
            <Image
              source={{ uri: post.image_url }}
              style={styles.featureImage}
              resizeMode="cover"
            />
          ) : null}

          {/* Job-specific header */}
          {isJob && (
            <RNView style={styles.jobHeader}>
              <RNView style={styles.companyInfo}>
                <ThemedText style={styles.companyName}>
                  {post.criteria?.company || 'Company'}
                </ThemedText>
                <RNView style={styles.jobBadges}>
                  {post.criteria?.location && (
                    <PostBadge
                      label={post.criteria.location}
                      icon="map-pin"
                      size="small"
                    />
                  )}
                  {post.criteria?.jobType && (
                    <PostBadge
                      label={post.criteria.jobType}
                      icon="clock"
                      size="small"
                    />
                  )}
                  {post.criteria?.salary && (
                    <PostBadge
                      label={post.criteria.salary}
                      icon="dollar-sign"
                      size="small"
                    />
                  )}
                </RNView>
              </RNView>
            </RNView>
          )}

          {/* News-specific header */}
          {isNews && (
            <RNView style={styles.newsHeader}>
              {post.criteria?.source && (
                <TouchableOpacity
                  style={styles.sourceContainer}
                  onPress={handleSourcePress}
                >
                  <Feather name="external-link" size={16} color="#007AFF" />
                  <ThemedText style={[styles.sourceText, { color: '#007AFF' }]}>
                    {post.criteria.source}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </RNView>
          )}

          {/* Content */}
          <ThemedText style={styles.description}>{post.content}</ThemedText>

          {/* Timestamp */}
          <ThemedText style={[styles.timestamp, { color: mutedTextColor }]}>
            {formatDate(post.created_at)}
          </ThemedText>

          {/* Actions */}
          <RNView style={[styles.actionsContainer, { borderTopColor: borderColor }]}>
            <PostInteractionBar postId={post.id} size="large" />
            {isJob && (
              <ApplyButton
                onPress={() => {
                  if (post) {
                    openGlobalSheet({
                      snapPoints: ['90%'],
                      children: (
                        <JobApplicationSheetContent
                          post={post}
                          onSuccess={() => router.back()}
                        />
                      ),
                    });
                  }
                }}
                size="medium"
              />
            )}
            {isNews && post.criteria?.source && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={handleSourcePress}
              >
                <ThemedText style={styles.readMoreText}>Read More</ThemedText>
              </TouchableOpacity>
            )}
          </RNView>
        </ThemedView>

        {/* Recommended Posts */}
        {recommendedPosts.length > 0 && (
          <ThemedView style={[styles.similarContainer, { borderTopColor: borderColor }]}>
            <ThemedText style={styles.similarTitle}>
              {isJob ? 'Similar Jobs' : 'Related News'}
            </ThemedText>
            <RNView style={styles.recommendedListContainer}>
              {recommendedPosts.map((item) => {
                const itemCompanyName = item.criteria?.company || 'Company';
                const itemCompanyLogo =
                  item.criteria?.companyLogo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(itemCompanyName)}&size=128`;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.recommendedItem,
                      { backgroundColor: backgroundSecondary },
                    ]}
                    onPress={() => router.push(`/post/${item.id}`)}
                  >
                    <Image source={{ uri: itemCompanyLogo }} style={styles.recommendedLogo} />
                    <RNView style={styles.recommendedInfo}>
                      <ThemedText style={styles.recommendedTitle}>{item.title}</ThemedText>
                      <ThemedText style={styles.recommendedCompany}>
                        {isJob ? itemCompanyName : item.criteria?.source || 'News Source'}
                      </ThemedText>
                    </RNView>
                    <RNView style={styles.recommendedRight}>
                      {isJob && (
                        <PostBadge label={item.criteria?.location || 'Remote'} size="small" />
                      )}
                      {isNews && item.industry && (
                        <PostBadge label={item.industry} size="small" />
                      )}
                    </RNView>
                  </TouchableOpacity>
                );
              })}
            </RNView>
          </ThemedView>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  headerRightButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 8, borderRadius: 20 },
  scrollView: { flex: 1 },
  contentContainer: {},
  typeBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  postTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 30
  },
  featureImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16
  },
  jobHeader: {
    marginBottom: 16
  },
  companyInfo: {
    gap: 8
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600'
  },
  jobBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  newsHeader: {
    marginBottom: 16
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '500'
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16
  },
  timestamp: {
    fontSize: 14,
    marginBottom: 16
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1
  },
  readMoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readMoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  similarContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  recommendedListContainer: {
    gap: 12
  },
  recommendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 16
  },
  recommendedLogo: {
    width: 40,
    height: 40,
    borderRadius: 4
  },
  recommendedInfo: {
    flex: 1,
    gap: 4
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  recommendedCompany: {
    fontSize: 14,
    opacity: 0.7
  },
  recommendedRight: {
    alignItems: 'flex-end'
  },
});

export default PostDetail;
