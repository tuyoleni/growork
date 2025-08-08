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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePosts as usePostById } from '@/hooks/usePostById';
import { usePosts as useFeedPosts } from '@/hooks/usePosts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useApplicationStatus } from '@/hooks/useApplicationStatus';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';
import { Post } from '@/types';
import { PostType } from '@/types/enums';
import { useFlashToast } from '@/components/ui/Flash';

import PostInteractionBar from '@/components/content/PostInteractionBar';
import ApplyButton from '@/components/content/post/ApplyButton';
import PostBadge from '@/components/content/post/PostBadge';
import { openGlobalSheet } from '@/utils/globalSheet';
import JobApplicationForm from '@/components/content/JobApplicationForm';
import { PostDetailSkeleton } from '@/components/ui/Skeleton';

const ICON_SIZE = 20;
const { width: screenWidth } = Dimensions.get('window');

const PostDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useFlashToast();

  const [post, setPost] = useState<Post | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const { loading: isLoading, getPostById } = usePostById();
  const { posts: allPosts, loading: feedLoading, fetchPosts } = useFeedPosts();
  const { application, hasApplied, loading: applicationLoading, checkApplicationStatus } = useApplicationStatus(id as string);

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
        <PostDetailSkeleton />
      </ScreenContainer>
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                label={post.industry}
                size="small"
              />
            )}
          </RNView>

          {/* Title */}
          <ThemedText style={styles.postTitle}>{post.title}</ThemedText>

          {/* Image - only show if provided */}
          {post.image_url && (
            <RNView style={styles.imageContainer}>
              <Image
                source={{ uri: post.image_url }}
                style={styles.featureImage}
                resizeMode="cover"
              />
            </RNView>
          )}

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

          {/* Application Status */}
          {isJob && hasApplied && application && (
            <ThemedView style={[styles.applicationStatus, { borderColor: borderColor }]}>
              <RNView style={styles.applicationStatusHeader}>
                <Feather name="check-circle" size={16} color="#10b981" />
                <ThemedText style={[styles.applicationStatusTitle, { color: '#10b981' }]}>
                  Application Submitted
                </ThemedText>
              </RNView>
              <ThemedText style={[styles.applicationStatusText, { color: mutedTextColor }]}>
                Applied on {formatDate(application.created_at)}
              </ThemedText>
              {application.status && (
                <ThemedText style={[styles.applicationStatusText, { color: mutedTextColor }]}>
                  Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>

        {/* Actions */}
        <ThemedView style={[styles.actionsContainer, { borderTopColor: borderColor }]}>
          <PostInteractionBar postId={post.id} postOwnerId={post.user_id} size="large" />
          {isJob && (
            <ApplyButton
              onPress={() => {
                if (post && !hasApplied) {
                  openGlobalSheet({
                    snapPoints: ['90%'],
                    children: (
                      <JobApplicationForm
                        jobPost={post}
                        onSuccess={() => {
                          checkApplicationStatus();
                          router.back();
                        }}
                      />
                    ),
                  });
                } else if (hasApplied) {
                  toast.show({
                    type: 'info',
                    title: 'Already Applied',
                    message: 'You have already applied to this position.'
                  });
                }
              }}
              size="medium"
              applied={hasApplied}
              disabled={applicationLoading}
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
                      <ThemedText style={styles.recommendedTitle} numberOfLines={2}>
                        {item.title}
                      </ThemedText>
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
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  postTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  jobHeader: {
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  companyInfo: {
    gap: 12,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  jobBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  newsHeader: {
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  timestamp: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  applicationStatus: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    backgroundColor: '#f0fdf4',
  },
  applicationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  applicationStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  applicationStatusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    marginTop: 8,
  },
  readMoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  readMoreText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  similarContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  similarTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  recommendedListContainer: {
    gap: 16,
  },
  recommendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendedLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  recommendedInfo: {
    flex: 1,
    gap: 6,
    minWidth: 0, // Allow text to shrink
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  recommendedCompany: {
    fontSize: 14,
    opacity: 0.7,
  },
  recommendedRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
});

export default PostDetail;
