import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Skeleton } from '@/components/ui/Skeleton';
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useAppContext } from "@/utils/AppContext";
import { ThemedText } from "../../ThemedText";
import { CommentItem } from "./CommentItem";
import { EmojiBar } from "./EmojiBar";
import { CommentsInputBar } from "./CommentsInputBar";
import type { Profile } from "@/types"; // Adjust per your project

type LikeMap = Record<string, boolean>;
type CountMap = Record<string, number>;

interface CommentsProps {
  postId: string;
  disableScrolling?: boolean;
}

export default function Comments({ postId, disableScrolling = false }: CommentsProps) {
  const { user, profile } = useAuth(); // Keep user for 'isOwn', use only profile for avatar
  const {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
    formatCommentDate,
  } = useComments();
  const {
    toggleCommentLike: toggleLike,
    isCommentLiked: isLiked,
    getCommentLikeCount: getLikeCount,
  } = useAppContext();

  const { showActionSheetWithOptions } = useActionSheet();

  const [commentText, setCommentText] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [likedComments, setLikedComments] = useState<LikeMap>({});
  const [likeCounts, setLikeCounts] = useState<CountMap>({});
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (postId) {
      fetchComments(postId);
      setCommentText("");
    }
  }, [postId]);

  useEffect(() => {
    const loadLikeData = async () => {
      if (comments.length > 0) {
        const likeStates: LikeMap = {};
        const counts: CountMap = {};
        for (const comment of comments) {
          const [liked, count] = await Promise.all([
            isLiked(comment.id),
            getLikeCount(comment.id),
          ]);
          likeStates[comment.id] = liked;
          counts[comment.id] = count;
        }
        setLikedComments(likeStates);
        setLikeCounts(counts);
      }
    };
    loadLikeData();
  }, [comments, isLiked, getLikeCount]);

  const handleSubmitComment = async () => {
    if (!profile || !commentText.trim()) return;
    setIsSending(true);
    await addComment(
      postId,
      profile.id, // use profile id
      commentText,
      {
        id: profile.id,
        avatar_url: profile.avatar_url,
        name: profile.name,
        surname: profile.surname,
        username: profile.username,
      }
    );
    setCommentText("");
    setIsSending(false);
  };

  const handleToggleLike = async (commentId: string) => {
    const prevLiked = likedComments[commentId];
    setLikedComments((prev) => ({ ...prev, [commentId]: !prevLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [commentId]: prev[commentId] + (prevLiked ? -1 : 1),
    }));
    const result = await toggleLike(commentId);
    if (!result.success) {
      setLikedComments((prev) => ({ ...prev, [commentId]: prevLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (prevLiked ? 1 : -1),
      }));
    }
  };

  const handleMenu = (commentId: string) => {
    const options = ["Delete", "Cancel"];
    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        title: "Comment Options",
        message: "Delete this comment?",
      },
      (selectedIndex?: number) => {
        if (selectedIndex === 0) {
          deleteComment(commentId);
        }
      }
    );
  };

  const emojiReactions = ["❤️", "👏", "🔥", "🙏", "😢", "😊", "😮", "😂"];

  const content = (
    <>
      {/* Comments Section */}
      {disableScrolling ? (
        <View style={styles.scrollView}>
          <View style={[
            !comments.length && !loading ? styles.emptyList : styles.scrollContent
          ]}>
            {loading && (
              <View style={styles.skeletonContainer}>
                {[1, 2].map((index) => (
                  <View key={index} style={styles.skeletonItem}>
                    <View style={styles.skeletonHeader}>
                      <Skeleton width={32} height={32} borderRadius={16} style={styles.skeletonAvatar} />
                      <View style={styles.skeletonText}>
                        <Skeleton width={80} height={12} borderRadius={4} style={styles.skeletonName} />
                        <Skeleton width={60} height={10} borderRadius={4} />
                      </View>
                    </View>
                    <View style={styles.skeletonContent}>
                      <Skeleton width="90%" height={12} borderRadius={4} style={styles.skeletonLine} />
                      <Skeleton width="70%" height={12} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            )}
            {!loading && comments.length === 0 && (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  No comments yet. Be the first!
                </ThemedText>
              </View>
            )}
            {comments.map((item) => (
              <CommentItem
                key={item.id}
                item={item}
                isOwn={profile ? item.user_id === profile.id : false}
                isAuthor={item.user_id === profile?.id} liked={likedComments[item.id] || false}
                likeCount={likeCounts[item.id] || 0}
                onLike={() => handleToggleLike(item.id)}
                onMenu={() => handleMenu(item.id)}
                formatDate={formatCommentDate}
              />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            !comments.length && !loading ? styles.emptyList : styles.scrollContent
          }
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.skeletonContainer}>
              {[1, 2].map((index) => (
                <View key={index} style={styles.skeletonItem}>
                  <View style={styles.skeletonHeader}>
                    <Skeleton width={32} height={32} borderRadius={16} style={styles.skeletonAvatar} />
                    <View style={styles.skeletonText}>
                      <Skeleton width={80} height={12} borderRadius={4} style={styles.skeletonName} />
                      <Skeleton width={60} height={10} borderRadius={4} />
                    </View>
                  </View>
                  <View style={styles.skeletonContent}>
                    <Skeleton width="90%" height={12} borderRadius={4} style={styles.skeletonLine} />
                    <Skeleton width="70%" height={12} borderRadius={4} />
                  </View>
                </View>
              ))}
            </View>
          )}
          {!loading && comments.length === 0 && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No comments yet. Be the first!
              </ThemedText>
            </View>
          )}
          {comments.map((item) => (
            <CommentItem
              key={item.id}
              item={item}
              isOwn={profile ? item.user_id === profile.id : false}
              isAuthor={item.user_id === profile?.id} liked={likedComments[item.id] || false}
              likeCount={likeCounts[item.id] || 0}
              onLike={() => handleToggleLike(item.id)}
              onMenu={() => handleMenu(item.id)}
              formatDate={formatCommentDate}
            />
          ))}
        </ScrollView>
      )}

      {/* Fixed Input Section - Non-scrollable */}
      <View style={styles.inputSection}>
        <EmojiBar emojis={emojiReactions} onEmoji={(e) => setCommentText((prev) => prev + e)} />
        <CommentsInputBar
          profile={profile}
          value={commentText}
          onChange={setCommentText}
          onSend={handleSubmitComment}
          isSending={isSending}
          inputRef={inputRef}
          onEmojiPicker={() => inputRef.current?.focus()}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}
    </>
  );

  // Use KeyboardAvoidingView only when not in a bottom sheet
  if (disableScrolling) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  skeletonContainer: {
    padding: 12,
  },
  skeletonItem: {
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  skeletonAvatar: {
    marginRight: 8,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonName: {
    marginBottom: 4,
  },
  skeletonContent: {
    marginLeft: 40,
  },
  skeletonLine: {
    marginBottom: 4,
  },
  inputSection: {
    // No border separator
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    color: "#ff4757",
  },
});
