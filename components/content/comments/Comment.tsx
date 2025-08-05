import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
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
}

export default function Comments({ postId }: CommentsProps) {
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.sheet]}
    >
      <ScrollView
        contentContainerStyle={
          !comments.length && !loading ? styles.emptyList : undefined
        }
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading && <ActivityIndicator />}
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
      <View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    width: "100%",
    paddingTop: 2,
    overflow: "hidden",
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
