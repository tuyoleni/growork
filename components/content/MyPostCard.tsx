import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MyPost } from '@/hooks/useMyPosts';

interface MyPostCardProps {
  post: MyPost;
  onStatusUpdate?: (postId: string, status: 'active' | 'inactive') => void;
  onDelete?: (postId: string) => void;
}

export function MyPostCard({
  post,
  onStatusUpdate,
  onDelete
}: MyPostCardProps) {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#34C759' : '#FF3B30';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 'check-circle' : 'pause-circle';
  };

  const handleViewApplications = () => {
    router.push(`/application/${post.id}`);
  };

  const handleStatusToggle = () => {
    const newStatus = post.is_active ? 'inactive' : 'active';
    const action = post.is_active ? 'pause' : 'activate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Post`,
      `Are you sure you want to ${action} this post?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => onStatusUpdate?.(post.id, newStatus),
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(post.id),
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      <View style={styles.header}>
        <View style={styles.postInfo}>
          <ThemedText style={[styles.postTitle, { color: textColor }]}>
            {post.title}
          </ThemedText>
          <View style={styles.postDetails}>
            <View style={styles.detailRow}>
              <Feather name="briefcase" size={14} color={mutedTextColor} />
              <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                {post.type}
              </ThemedText>
            </View>
            {post.industry && (
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={mutedTextColor} />
                <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                  {post.industry}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Feather
            name={getStatusIcon(post.is_active)}
            size={20}
            color={getStatusColor(post.is_active)}
          />
          <ThemedText style={[styles.statusText, { color: getStatusColor(post.is_active) }]}>
            {post.is_active ? 'Active' : 'Paused'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="users" size={16} color={mutedTextColor} />
            <ThemedText style={[styles.statText, { color: mutedTextColor }]}>
              {post.applications_count} application{post.applications_count !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="calendar" size={16} color={mutedTextColor} />
            <ThemedText style={[styles.statText, { color: mutedTextColor }]}>
              {new Date(post.created_at).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor }]}
          onPress={handleViewApplications}
        >
          <Feather name="users" size={16} color={tintColor} />
          <ThemedText style={[styles.actionButtonText, { color: tintColor }]}>
            View Applications
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: post.is_active ? '#FF3B30' : '#34C759' }]}
            onPress={handleStatusToggle}
          >
            <Feather 
              name={post.is_active ? 'pause' : 'play'} 
              size={14} 
              color="#FFFFFF" 
            />
            <ThemedText style={styles.statusButtonText}>
              {post.is_active ? 'Pause' : 'Activate'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { borderColor }]}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={14} color="#FF3B30" />
            <ThemedText style={[styles.deleteButtonText, { color: '#FF3B30' }]}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    marginLeft: 6,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
}); 