import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  View as RNView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostApplicationForm from '@/components/content/postApplicationForm';
import { usePosts as usePostById } from '@/hooks/usePostById';
import { usePosts as useFeedPosts } from '@/hooks/usePosts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Post } from '@/types';

import PostInteractionBar from '@/components/content/PostInteractionBar';
import ApplyButton from '@/components/content/post/ApplyButton';
import PostBadge from '@/components/content/post/PostBadge';

const PostDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [post, setPost] = useState<Post | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const { loading: isLoading, getPostById } = usePostById();
  // Fetch all posts for recommendations
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

  // Get similar posts (same type, not current post)
  let recommendedPosts: Post[] = [];
  if (post && allPosts) {
    recommendedPosts = allPosts.filter(
      (p: Post) => p.type === post.type && p.id !== post.id
    );
  }

  if (isLoading || feedLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
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

  // Only use what's provided in 'criteria' and Post
  const companyName = post.criteria?.company || 'Company';
  const companyLogo =
    post.criteria?.companyLogo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128`;
  const verified = post.criteria?.isVerified;
  const mainImage = post.image_url || '';

  const location = post.criteria?.location || 'Remote';
  const jobType = post.criteria?.jobType || post.type || 'Full-time';
  const isRemote = location.toLowerCase().includes('remote');
  const requirements = post.criteria?.requirements || [];
  const benefits = post.criteria?.benefits || [];

  // "Similar" section label is always by type, capitalized
  const similarSectionLabel =
    post.type && typeof post.type === 'string'
      ? `Similar ${post.type.charAt(0).toUpperCase() + post.type.slice(1)}s`
      : 'Similar';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <RNView style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="share-2" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="more-horizontal" size={24} color={textColor} />
          </TouchableOpacity>
        </RNView>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.contentContainer}>
          {/* Company Info */}
          <RNView style={styles.companyHeader}>
            <Image
              source={{ uri: companyLogo }}
              style={styles.companyLogo}
            />
            <RNView style={styles.companyNameContainer}>
              <RNView style={styles.companyNameRow}>
                <ThemedText style={styles.companyName}>{companyName}</ThemedText>
                {verified && (
                  <Feather name="check-circle" size={16} color={tintColor} />
                )}
              </RNView>
            </RNView>
            {post.type === 'job' && (
              <PostBadge
                label="Actively Hiring"
                variant="highlighted"
                size="small"
                style={styles.hiringBadge}
              />
            )}
          </RNView>

          {/* Title */}
          <ThemedText style={styles.jobTitle}>{post.title}</ThemedText>

          {/* Main Image */}
          {mainImage ? (
            <Image
              source={{ uri: mainImage }}
              style={styles.featureImage}
              resizeMode="cover"
            />
          ) : null}

          {/* Badges and details */}
          <ThemedView style={styles.detailsContainer}>
            <RNView style={styles.badgeContainer}>
              <PostBadge label={location} icon="map-pin" size="medium" />
              <PostBadge label={jobType} icon="clock" size="medium" />
              {isRemote && (
                <PostBadge label="Remote Available" size="medium" />
              )}
            </RNView>
            <ThemedText style={styles.description}>{post.content}</ThemedText>

            {/* Requirements */}
            {requirements.length > 0 && (
              <RNView style={styles.requirementsContainer}>
                <ThemedText style={styles.sectionTitle}>Requirements:</ThemedText>
                {requirements.map((requirement, index) => (
                  <ThemedText key={index} style={styles.listItem}>• {requirement}</ThemedText>
                ))}
              </RNView>
            )}
            {/* Benefits */}
            {benefits.length > 0 && (
              <RNView style={styles.benefitsContainer}>
                <ThemedText style={styles.sectionTitle}>Benefits:</ThemedText>
                {benefits.map((benefit, index) => (
                  <ThemedText key={index} style={styles.listItem}>• {benefit}</ThemedText>
                ))}
              </RNView>
            )}
            <RNView style={[styles.actionsContainer, { borderTopColor: borderColor }]}>
              <PostInteractionBar postId={post.id} size="large" />
              <ApplyButton onPress={() => setShowApplicationForm(true)} size="medium" />
            </RNView>
          </ThemedView>

          {recommendedPosts.length > 0 && (
            <ThemedView style={[styles.similarJobsContainer, { borderTopColor: borderColor }]}>
              <ThemedText style={styles.similarJobsTitle}>
                {similarSectionLabel}
              </ThemedText>
              <RNView style={styles.recommendedListContainer}>
                {recommendedPosts.map((item) => {
                  // All fields from 'criteria' only, fallback to "Company" and default avatar if missing
                  const itemCompanyName = item.criteria?.company || 'Company';
                  const itemCompanyLogo =
                    item.criteria?.companyLogo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(itemCompanyName)}&size=128`;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.recommendedItem, { backgroundColor: backgroundSecondary }]}
                      onPress={() => router.push(`/post/${item.id}`)}
                    >
                      <Image
                        source={{ uri: itemCompanyLogo }}
                        style={styles.recommendedLogo}
                      />
                      <RNView style={styles.recommendedInfo}>
                        <ThemedText style={styles.recommendedTitle}>{item.title}</ThemedText>
                        <ThemedText style={styles.recommendedCompany}>{itemCompanyName}</ThemedText>
                      </RNView>
                      <RNView style={styles.recommendedRight}>
                        <PostBadge label={item.criteria?.location || 'Remote'} size="small" />
                      </RNView>
                    </TouchableOpacity>
                  );
                })}
              </RNView>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      {/* Application Modal */}
      {post && (
        <Modal
          visible={showApplicationForm}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowApplicationForm(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
            <PostApplicationForm
              jobPost={post}
              onSuccess={() => {
                setShowApplicationForm(false);
                router.back();
              }}
              onCancel={() => setShowApplicationForm(false)}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerRightButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 8, borderRadius: 20 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  companyLogo: { width: 40, height: 40, borderRadius: 4 },
  companyNameContainer: { flex: 1 },
  companyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  companyName: { fontSize: 16, fontWeight: '600' },
  hiringBadge: { borderRadius: 12 },
  jobTitle: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  featureImage: { width: '100%', height: 250, borderRadius: 8, marginBottom: 16 },
  detailsContainer: { marginTop: 16, gap: 16 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  description: { fontSize: 16, lineHeight: 24 },
  requirementsContainer: { gap: 8 },
  benefitsContainer: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  listItem: { fontSize: 16, lineHeight: 24, paddingLeft: 8, marginBottom: 4 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1 },
  similarJobsContainer: { marginTop: 16, borderTopWidth: 1, paddingTop: 16 },
  similarJobsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  recommendedListContainer: { gap: 12 },
  recommendedItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 8, gap: 16 },
  recommendedLogo: { width: 40, height: 40, borderRadius: 4 },
  recommendedInfo: { flex: 1, gap: 4 },
  recommendedTitle: { fontSize: 16, fontWeight: '600' },
  recommendedCompany: { fontSize: 14, opacity: 0.7 },
  recommendedRight: { alignItems: 'flex-end' },
});

export default PostDetail;
