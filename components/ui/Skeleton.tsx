import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width, height = 16, borderRadius = 4, style }: SkeletonProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') || '#f3f4f6';
  const shimmerColor = useThemeColor({}, 'backgroundTertiary') || '#e5e7eb';
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={[styles.skeleton, { width, height, borderRadius, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Content Card Skeleton
export function ContentCardSkeleton() {
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.cardContainer, { borderBottomColor: borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={16} borderRadius={4} style={styles.name} />
          <Skeleton width={80} height={12} borderRadius={4} />
        </View>
        <Skeleton width={60} height={16} borderRadius={4} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Skeleton width="100%" height={18} borderRadius={4} style={styles.title} />
        <Skeleton width="90%" height={16} borderRadius={4} style={styles.description} />
        <Skeleton width="85%" height={16} borderRadius={4} style={styles.description2} />
        <Skeleton width="70%" height={16} borderRadius={4} style={styles.description3} />
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <View style={styles.actionButtons}>
          <Skeleton width={60} height={32} borderRadius={16} />
          <Skeleton width={60} height={32} borderRadius={16} />
          <Skeleton width={60} height={32} borderRadius={16} />
        </View>
        <Skeleton width={80} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

// Post Detail Skeleton
export function PostDetailSkeleton() {
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.postDetailContainer}>
      {/* Header */}
      <View style={[styles.postHeader, { borderBottomColor: borderColor }]}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.postHeaderText}>
          <Skeleton width={150} height={18} borderRadius={4} style={styles.postName} />
          <Skeleton width={100} height={14} borderRadius={4} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>

      {/* Content */}
      <View style={styles.postContent}>
        <Skeleton width="100%" height={24} borderRadius={4} style={styles.postTitle} />
        <Skeleton width="95%" height={16} borderRadius={4} style={styles.postDescription} />
        <Skeleton width="90%" height={16} borderRadius={4} style={styles.postDescription2} />
        <Skeleton width="85%" height={16} borderRadius={4} style={styles.postDescription3} />
        <Skeleton width="80%" height={16} borderRadius={4} style={styles.postDescription4} />
        <Skeleton width="75%" height={16} borderRadius={4} style={styles.postDescription5} />
      </View>

      {/* Actions */}
      <View style={[styles.postActions, { borderTopColor: borderColor }]}>
        <View style={styles.postActionButtons}>
          <Skeleton width={50} height={32} borderRadius={16} />
          <Skeleton width={50} height={32} borderRadius={16} />
          <Skeleton width={50} height={32} borderRadius={16} />
        </View>
        <Skeleton width={100} height={36} borderRadius={18} />
      </View>
    </View>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton() {
  return (
    <View style={styles.searchResultsContainer}>
      {[1, 2, 3].map((index) => (
        <View key={`search-result-${index}`} style={styles.searchResultItem}>
          <ContentCardSkeleton />
        </View>
      ))}
    </View>
  );
}

// Company Details Skeleton
export function CompanyDetailsSkeleton() {
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.companyDetailsContainer}>
      {/* Header */}
      <View style={[styles.companyHeader, { borderBottomColor: borderColor }]}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={120} height={18} borderRadius={4} style={styles.companyHeaderTitle} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      {/* Company Info */}
      <View style={styles.companyInfoSection}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <View style={styles.companyInfoText}>
          <Skeleton width={200} height={24} borderRadius={4} style={styles.companyName} />
          <Skeleton width={150} height={16} borderRadius={4} style={styles.companyIndustry} />
          <Skeleton width={180} height={14} borderRadius={4} style={styles.companyLocation} />
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsSection, { borderBottomColor: borderColor }]}>
        <View style={styles.statItem}>
          <Skeleton width={40} height={20} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={4} style={styles.statLabel} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={40} height={20} borderRadius={4} />
          <Skeleton width={80} height={14} borderRadius={4} style={styles.statLabel} />
        </View>
      </View>

      {/* Follow Button */}
      <View style={styles.followButtonSection}>
        <Skeleton width="100%" height={44} borderRadius={22} />
      </View>

      {/* Description */}
      <View style={[styles.descriptionSection, { borderBottomColor: borderColor }]}>
        <Skeleton width="100%" height={16} borderRadius={4} style={styles.descriptionLine} />
        <Skeleton width="90%" height={16} borderRadius={4} style={styles.descriptionLine} />
        <Skeleton width="85%" height={16} borderRadius={4} style={styles.descriptionLine} />
      </View>

      {/* Posts Section */}
      <View style={styles.postsSection}>
        <Skeleton width={80} height={20} borderRadius={4} style={styles.postsTitle} />
        {[1, 2, 3].map((index) => (
          <View key={`company-post-${index}`} style={styles.postItem}>
            <ContentCardSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    marginBottom: 4,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 4,
  },
  description2: {
    marginBottom: 4,
  },
  description3: {
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  postDetailContainer: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  postHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  postName: {
    marginBottom: 4,
  },
  postContent: {
    marginBottom: 16,
  },
  postTitle: {
    marginBottom: 12,
  },
  postDescription: {
    marginBottom: 8,
  },
  postDescription2: {
    marginBottom: 8,
  },
  postDescription3: {
    marginBottom: 8,
  },
  postDescription4: {
    marginBottom: 8,
  },
  postDescription5: {
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  postActionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultItem: {
    marginBottom: 8,
  },
  companyDetailsContainer: {
    flex: 1,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  companyHeaderTitle: {
    flex: 1,
    textAlign: 'center',
  },
  companyInfoSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  companyInfoText: {
    marginLeft: 16,
    flex: 1,
  },
  companyName: {
    marginBottom: 4,
  },
  companyIndustry: {
    marginBottom: 4,
  },
  companyLocation: {
    marginBottom: 4,
  },
  statsSection: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    marginTop: 2,
  },
  followButtonSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  descriptionSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  descriptionLine: {
    marginBottom: 8,
  },
  postsSection: {
    padding: 16,
  },
  postsTitle: {
    marginBottom: 16,
  },
  postItem: {
    marginBottom: 8,
  },
}); 