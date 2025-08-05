import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { useAuth } from "@/hooks/useAuth";
import { useComments, Comment } from "@/hooks/useComments";
import { useAppContext } from "@/utils/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Image } from "expo-image";
import { ThemedText } from "../ThemedText";
import { ThemedInput } from "../ThemedInput";

const ThemedAvatar: React.FC<{
  image: string;
  size?: number;
  square?: boolean;
  children?: React.ReactNode;
}> = ({
  image,
  size = 42,
  square = false,
  children,
}) => (
  <View style={{ position: "relative" }}>
    <Image
      source={{ uri: image }}
      style={{
        width: size,
        height: size,
        borderRadius: square ? 4 : size / 2,
      }}
    />
    {children}
  </View>
);

const ThemedIconButton = ({
  icon,
  onPress,
  disabled = false,
}: {
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    style={({ pressed }) => [
      {
        opacity: pressed ? 0.5 : disabled ? 0.3 : 1,
        padding: 6,
      },
    ]}
    hitSlop={10}
    onPress={onPress}
    disabled={disabled}
  >
    {icon}
  </Pressable>
);

interface CommentsProps {
  postId: string;
  postTitle?: string;
}

export default function Comments({ postId }: CommentsProps) {
  const { user, profile } = useAuth();
  const {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
    formatCommentDate,
  } = useComments();
  const { toggleCommentLike: toggleLike, isCommentLiked: isLiked, getCommentLikeCount: getLikeCount } = useAppContext();

  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const inputRef = useRef<any>(null);

  // Theme colors
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");

  useEffect(() => {
    if (postId) {
      fetchComments(postId);
      setCommentText("");
    }
  }, [postId]);

  useEffect(() => {
    const loadLikeData = async () => {
      if (comments.length > 0) {
        const likeStates: Record<string, boolean> = {};
        const counts: Record<string, number> = {};
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
    if (!user || !commentText.trim()) return;
    setIsSending(true);
    await addComment(
      postId,
      user.id,
      commentText,
      profile
        ? {
            id: profile.id,
            avatar_url: profile.avatar_url,
            name: profile.name,
            surname: profile.surname,
            username: profile.username,
          }
        : undefined
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
      // Rollback on error
      setLikedComments((prev) => ({ ...prev, [commentId]: prevLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [commentId]: prev[commentId] + (prevLiked ? 1 : -1),
      }));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: Comment
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });
    return (
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "center",
          transform: [{ translateX: trans }],
        }}
      >
        <RectButton
          style={styles.deleteButton}
          onPress={() => handleDeleteComment(item.id)}
        >
          <Feather name="trash-2" size={20} color="#fff" />
          <ThemedText style={{ color: "#fff", marginLeft: 8, fontWeight: "600" }}>
            Delete
          </ThemedText>
        </RectButton>
      </Animated.View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const displayName = item.profiles
      ? `${item.profiles.name} ${item.profiles.surname}`
      : "Anonymous";
    const avatarUrl =
      item.profiles?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128`;
    const isCommentLiked = likedComments[item.id] || false;
    const commentLikeCount = likeCounts[item.id] || 0;

    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item)
        }
        overshootRight={false}
      >
        <View style={[styles.commentRow, { borderColor }]}>
          <ThemedAvatar image={avatarUrl} />
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold" style={styles.displayName}>
                  {displayName}
                </ThemedText>
                <ThemedText style={[styles.timeText, { color: mutedTextColor }]}>
                  {formatCommentDate(item.created_at)}
                </ThemedText>
              </View>
              <ThemedIconButton
                icon={
                  <Feather
                    name="more-horizontal"
                    size={16}
                    color={mutedTextColor}
                  />
                }
                onPress={() => {}}
              />
            </View>
            <ThemedText style={styles.commentContent}>
              {item.content}
            </ThemedText>
            <View style={styles.actionsRow}>
              <View style={styles.likeContainer}>
                <ThemedIconButton
                  icon={
                    <Feather
                      name="heart"
                      size={16}
                      color={isCommentLiked ? "#ff4757" : mutedTextColor}
                      fill={isCommentLiked ? "#ff4757" : "none"}
                    />
                  }
                  onPress={() => handleToggleLike(item.id)}
                />
                {commentLikeCount > 0 && (
                  <ThemedText style={[styles.likeCount, { color: mutedTextColor }]}>
                    {commentLikeCount}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

  const emojiReactions = ["❤️", "👏", "🔥", "🙏", "😢", "😊", "😮", "😂"];
  const ThemedBadge = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      style={[
        styles.badge,
        {
          borderColor,
        },
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.sheet]}
    >
      {/* Comments List */}
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: mutedTextColor }]}>
                No comments yet. Be the first!
              </ThemedText>
            </View>
          )
        }
        ListHeaderComponent={loading ? <ActivityIndicator /> : null}
        contentContainerStyle={
          !comments.length && !loading ? styles.emptyList : undefined
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {emojiReactions.map((emoji) => (
          <ThemedBadge
            key={emoji}
            onPress={() => setCommentText((prev) => prev + emoji)}
          >
            <ThemedText style={styles.badgeText}>{emoji}</ThemedText>
          </ThemedBadge>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputWrap, { borderColor}]}>
        {user && (
          <ThemedAvatar
            image={
              profile?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile?.name || "User"
              )}&size=128`
            }
            size={32}
          />
        )}
        <ThemedInput
          style={styles.textInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <ThemedIconButton
          icon={<Feather name="smile" size={20} color={mutedTextColor} />}
          onPress={() => {
            inputRef.current?.focus();
          }}
        />
        <ThemedIconButton
          icon={
            isSending ? (
              <ActivityIndicator size={20} color={tintColor} />
            ) : (
              <Feather name="send" size={20} color={tintColor} />
            )
          }
          onPress={handleSubmitComment}
          disabled={isSending || !commentText.trim()}
        />
      </View>
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: "#ff4757" }]}>
            {error}
          </ThemedText>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    width: "100%",
    paddingTop: 2,
    overflow: "hidden",
  },
  //mmmmmm
  commentRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,

    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  commentCard: {
    flex: 1,
    gap: 7,
  },
  commentHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  displayName: {
    fontSize: 15,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 4,
    alignItems: "center",
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    height: 30,
    minWidth: 36,
    paddingHorizontal: 11,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
    paddingBottom: 24,
  },
  textInput: {
    flex: 1,
    borderRadius: 18,
    minHeight: 34,
    maxHeight: 80,
    fontSize: 15,
    marginBottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  badgeText: {
    fontSize: 16,
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
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4757",
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    borderRadius: 0,
  },
});
