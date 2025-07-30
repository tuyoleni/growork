import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useComments, Comment } from '@/hooks/useComments';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

interface CommentsProps {
  postId: string;
  onClose?: () => void;
}

export default function Comments({ postId, onClose }: CommentsProps) {
  const { user, profile } = useAuth();
  const { comments, loading, error, fetchComments, addComment, formatCommentDate } = useComments();
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  // Fetch comments on postId change
  useEffect(() => {
    if (postId) fetchComments(postId);
    setCommentText('');
  }, [postId]);

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!user || !postId || !commentText.trim()) return;
    try {
      setIsSending(true);
      const userProfileData = profile
        ? {
            id: profile.id,
            avatar_url: profile.avatar_url,
            name: profile.name,
            surname: profile.surname,
            username: profile.username,
          }
        : undefined;
      await addComment(postId, user.id, commentText, userProfileData);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCommentText('');
    } catch (error) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Retry load comments
  const handleRetry = useCallback(() => {
    if (postId) fetchComments(postId);
  }, [postId, fetchComments]);

  // Pull to refresh logic
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComments(postId);
    setRefreshing(false);
  };

  // Render single comment row
  const renderComment = ({ item }: { item: Comment }) => {
    const profile = item.profiles;
    const displayName = profile ? `${profile.name} ${profile.surname}` : 'Anonymous';
    const avatarUrl = profile?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128`;
    return (
      <View style={styles.commentContainer}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <ThemedText style={styles.userName} type="defaultSemiBold">
              {displayName}
            </ThemedText>
            <ThemedText style={[styles.commentTime, { color: mutedTextColor }]}>
              {formatCommentDate(item.created_at)}
            </ThemedText>
          </View>
          <ThemedText style={styles.commentText}>{item.content}</ThemedText>
        </View>
      </View>
    );
  };

  // FlatList for body
  const bodyComponent = (
    <View style={styles.container}>
      {loading && !comments.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable
            style={[styles.retryButton, { backgroundColor: tintColor }]}
            onPress={handleRetry}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No comments yet. Be the first to comment!
              </ThemedText>
            </View>
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );

  // Footer
  const footerComponent = (
    <View style={[styles.inputContainer, { borderColor }]}>
      {user ? (
        <>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            placeholder="Add a comment..."
            placeholderTextColor={mutedTextColor}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={350}
            editable={!isSending}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  !commentText.trim() || isSending ? mutedTextColor : tintColor,
              },
            ]}
            disabled={!commentText.trim() || isSending}
            onPress={handleSubmitComment}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </>
      ) : (
        <ThemedText style={styles.loginPrompt}>
          Please log in to comment
        </ThemedText>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      enabled={Platform.OS === 'ios'}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={16}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <ThemedText style={styles.headerTitle}>Comments</ThemedText>
        {/* Body */}
        {bodyComponent}
        {/* Footer */}
        {footerComponent}
      </View>
    </KeyboardAvoidingView>
  );
}

// --- UI STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  errorText: {
    textAlign: 'center', marginBottom: 14, fontSize: 15,
  },
  retryButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 130,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    opacity: 0.7,
  },
  commentContainer: {
    flexDirection: 'row', marginBottom: 18,
  },
  avatar: {
    width: 37, height: 37, borderRadius: 18, marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  userName: {
    fontSize: 14, fontWeight: 'bold',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 21,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    backgroundColor: '#fafafc',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 84,
    borderWidth: 1,
    borderRadius: 18,
    marginRight: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fbfbff',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    flex: 1, textAlign: 'center', opacity: 0.7, padding: 10,
  },
});
