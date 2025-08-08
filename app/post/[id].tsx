'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import ThemedButton from '@/components/ui/ThemedButton';
import { openGlobalSheet } from '@/utils/globalSheet';
import JobApplicationForm from '@/components/content/JobApplicationForm';
import { PostDetailSkeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/utils/superbase';
import { TextToSpeechButton } from '@/components/content/TextToSpeechButton';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const ICON_SIZE = 20;
const { width: screenWidth } = Dimensions.get('window');

const PostDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useFlashToast();

  const [post, setPost] = useState<Post | null>(null);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});

  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const { loading: isLoading, getPostById } = usePostById();
  const { posts: allPosts, loading: feedLoading, fetchPosts } = useFeedPosts();
  const { application, hasApplied, loading: applicationLoading, checkApplicationStatus } = useApplicationStatus(id as string);
  const { speak, stop, isSpeaking, isPaused } = useTextToSpeech();

  // Cleanup text-to-speech when component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Function to fetch company data
  const fetchCompanyData = async (companyId: string) => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', companyId)
        .single();

      if (!companyError && companyData?.logo_url) {
        return companyData.logo_url;
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
    return null;
  };

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

  // Fetch company logos for recommended posts
  useEffect(() => {
    const fetchCompanyLogos = async () => {
      if (recommendedPosts.length > 0) {
        const logos: Record<string, string> = {};

        for (const post of recommendedPosts) {
          if (post.criteria?.companyId) {
            const logoUrl = await fetchCompanyData(post.criteria.companyId);
            if (logoUrl) {
              logos[post.criteria.companyId] = logoUrl;
            }
          }
        }

        setCompanyLogos(logos);
      }
    };

    fetchCompanyLogos();
  }, [recommendedPosts]);

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

  const handleShare = () => {
    if (post) {
      // TODO: Implement share functionality
      console.log('Share post:', post.id);
    }
  };

  const handleMoreOptions = () => {
    // TODO: Implement more options menu
    console.log('More options pressed');
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
          {post && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                const textToSpeak = `${post.title}. ${post.content}`;
                speak(textToSpeak);
              }}
              accessibilityLabel="Listen to post"
            >
              <Feather
                name={isSpeaking ? (isPaused ? 'play' : 'pause') : 'volume-2'}
                size={ICON_SIZE}
                color={textColor}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleMoreOptions}
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
          {/* Title */}
          <ThemedText style={styles.postTitle}>{post.title}</ThemedText>


          {/* Company Info - Minimal */}
          {isJob && post.criteria?.company && (
            <RNView style={styles.companyRow}>
              <ThemedText style={[styles.companyName, { color: mutedTextColor }]}>
                {post.criteria.company}
              </ThemedText>
              {post.criteria.location && (
                <ThemedText style={[styles.locationText, { color: mutedTextColor }]}>
                  • {post.criteria.location}
                </ThemedText>
              )}
            </RNView>
          )}

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

          {/* Content */}
          <ThemedText style={styles.description}>{post.content}</ThemedText>

          {/* Minimal Job Details */}
          {isJob && (
            <RNView style={styles.jobDetails}>
              {post.criteria?.salary && (
                <RNView style={styles.detailItem}>
                  <Feather name="dollar-sign" size={14} color={mutedTextColor} />
                  <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                    {post.criteria.salary}
                  </ThemedText>
                </RNView>
              )}
              {post.criteria?.jobType && (
                <RNView style={styles.detailItem}>
                  <Feather name="clock" size={14} color={mutedTextColor} />
                  <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                    {post.criteria.jobType}
                  </ThemedText>
                </RNView>
              )}
            </RNView>
          )}

          {/* Timestamp */}
          <ThemedText style={[styles.timestamp, { color: mutedTextColor }]}>
            {formatDate(post.created_at)}
          </ThemedText>

          {/* Application Status - Minimal */}
          {isJob && hasApplied && application && (
            <RNView style={[styles.applicationStatus, { borderColor: borderColor }]}>
              <RNView style={styles.applicationStatusHeader}>
                <Feather name="check-circle" size={16} color={textColor} />
                <ThemedText style={[styles.applicationStatusTitle, { color: textColor }]}>
                  Applied
                </ThemedText>
              </RNView>
              <ThemedText style={[styles.applicationStatusText, { color: mutedTextColor }]}>
                {formatDate(application.created_at)}
              </ThemedText>
            </RNView>
          )}
        </ThemedView>

        {/* Actions - Minimal */}
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
            <ThemedButton
              title="Read More"
              onPress={handleSourcePress}
              variant="primary"
              size="medium"
            />
          )}
        </ThemedView>

        {recommendedPosts.length > 0 && (
          <ThemedView style={[styles.similarContainer, { borderTopColor: borderColor }]}>
            <ThemedText style={styles.similarTitle}>
              {isJob ? 'Similar Jobs' : 'Related News'}
            </ThemedText>
            <RNView style={styles.recommendedListContainer}>
              {recommendedPosts.map((item) => {
                const itemCompanyName = item.criteria?.company || 'Company';
                const itemCompanyId = item.criteria?.companyId;

                // Use actual company logo if available, otherwise fallback to UI Avatars
                const itemCompanyLogo = itemCompanyId && companyLogos[itemCompanyId]
                  ? companyLogos[itemCompanyId]
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(itemCompanyName)}&size=128`;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.recommendedItem,
                      { borderColor: borderColor }
                    ]}
                    onPress={() => router.push(`/post/${item.id}`)}
                  >
                    <Image source={{ uri: itemCompanyLogo }} style={styles.recommendedLogo} />
                    <RNView style={styles.recommendedInfo}>
                      <ThemedText style={styles.recommendedTitle} numberOfLines={2}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={[styles.recommendedCompany, { color: mutedTextColor }]}>
                        {isJob ? itemCompanyName : item.criteria?.source || 'News Source'}
                      </ThemedText>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconButton: {
    padding: 8,
    borderRadius: 4,
    minWidth: 32,
    minHeight: 32,
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 28,
  },
  textToSpeechContainer: {
    marginBottom: 16,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  featureImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 20,
  },
  applicationStatus: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  applicationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  applicationStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  applicationStatusText: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  similarContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recommendedListContainer: {
    gap: 12,
  },
  recommendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    gap: 12,
    borderWidth: 1,
  },
  recommendedLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  recommendedInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  recommendedCompany: {
    fontSize: 12,
  },
});

export default PostDetail;
