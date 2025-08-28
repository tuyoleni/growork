import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Platform,
  StyleSheet,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  Modal,
  Animated,
} from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useAuth, useComments, usePosts, useThemeColor } from "@/hooks";
import { useAppContext } from "@/utils/AppContext";
import { ThemedText } from "../../ThemedText";
import { CommentItem } from "./CommentItem";
import { EmojiBar } from "./EmojiBar";
import { CommentsInputBar } from "./CommentsInputBar";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useCustomCommentsBottomSheet } from "@/hooks/ui/useBottomSheet";
import {
  Spacing,
  BorderRadius,
  Animation,
  Typography,
} from "@/constants/DesignSystem";

type LikeMap = Record<string, boolean>;
type CountMap = Record<string, number>;

interface CommentsBottomSheetProps {
  postId: string;
  postOwnerId?: string;
  visible: boolean;
  onClose?: () => void;
}

// Component that uses the context to render the bottom sheet
export function CommentsBottomSheetWithContext() {
  const { isVisible, currentPostId, currentPostOwnerId, closeCommentsSheet } =
    useCustomCommentsBottomSheet();

  console.log("CommentsBottomSheetWithContext:", { isVisible, currentPostId });

  if (!isVisible || !currentPostId) {
    return null;
  }

  return (
    <CommentsBottomSheet
      postId={currentPostId}
      postOwnerId={currentPostOwnerId || undefined}
      visible={isVisible}
      onClose={closeCommentsSheet}
    />
  );
}

export default function CommentsBottomSheet({
  postId,
  postOwnerId,
  visible,
  onClose,
}: CommentsBottomSheetProps) {
  const { profile } = useAuth();
  const { comments, loading, error, fetchComments, addComment, deleteComment } =
    useComments(postId);
  const { posts } = usePosts();
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
  const [postCreatorId, setPostCreatorId] = useState<string | null>(null);

  const inputRef = useRef<any>(null);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Theme colors
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedText = useThemeColor({}, "mutedText");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");

  // Utility function for formatting comment dates
  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle animations
  useEffect(() => {
    console.log("CommentsBottomSheet: visible changed to", visible);
    if (visible) {
      // Reset animation values first
      slideAnim.setValue(0);
      backdropOpacity.setValue(0);

      console.log("CommentsBottomSheet: Starting animations");
      // Start animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: Animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: Animation.duration.normal,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log("CommentsBottomSheet: Animations completed");
      });
    } else {
      console.log("CommentsBottomSheet: Closing animations");
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: Animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: Animation.duration.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  // Load comments and post data
  useEffect(() => {
    if (postId && visible) {
      fetchComments(postId);
      setCommentText("");

      // Get post creator ID
      const post = posts.find((p) => p.id === postId);
      if (post) {
        setPostCreatorId(post.user_id);
      }
    }
  }, [postId, visible, posts, fetchComments]);

  // Load like data for comments
  useEffect(() => {
    const loadLikeData = async () => {
      if (comments.length > 0) {
        const validComments = comments.filter(
          (comment) => comment && comment.id && typeof comment.id === "string"
        );
        const likeStates: LikeMap = {};
        const counts: CountMap = {};

        for (const comment of validComments) {
          try {
            const [liked, count] = await Promise.all([
              isLiked(comment.id),
              getLikeCount(comment.id),
            ]);
            likeStates[comment.id] = liked;
            counts[comment.id] = count;
          } catch (error) {
            console.error(
              `Error loading like data for comment ${comment.id}:`,
              error
            );
            likeStates[comment.id] = false;
            counts[comment.id] = 0;
          }
        }
        setLikedComments(likeStates);
        setLikeCounts(counts);
      }
    };

    if (comments.length > 0) {
      loadLikeData();
    }
  }, [comments, isLiked, getLikeCount]);

  const handleSubmitComment = async () => {
    if (!profile || !commentText.trim()) return;
    setIsSending(true);
    await addComment(commentText);
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

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    onClose?.();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  // Debug animation values
  useEffect(() => {
    const listener = slideAnim.addListener(({ value }) => {
      console.log("CommentsBottomSheet: slideAnim value:", value);
    });
    return () => slideAnim.removeListener(listener);
  }, [slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose || (() => {})}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
              backgroundColor:
                textColor === Colors.light.text
                  ? Colors.light.shadow
                  : Colors.dark.shadow,
            },
          ]}
        >
          <Pressable
            style={styles.backdropPressable}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: backgroundSecondary,
              transform: [{ translateY }],
              shadowColor:
                textColor === Colors.light.text
                  ? Colors.light.shadow
                  : Colors.dark.shadow,
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: borderColor }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>Comments</ThemedText>
              <ThemedText style={[styles.commentCount, { color: mutedText }]}>
                {comments.length}{" "}
                {comments.length === 1 ? "comment" : "comments"}
              </ThemedText>
            </View>
            <Pressable
              onPress={onClose || (() => {})}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={textColor} />
            </Pressable>
          </View>

          {/* Content with Keyboard Avoidance */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            style={styles.keyboardAvoidingView}
          >
            {/* Comments List */}
            <ScrollView
              style={styles.commentList}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {loading && (
                <View style={styles.skeletonContainer}>
                  {[1, 2, 3].map((index) => (
                    <View key={`skeleton-${index}`} style={styles.skeletonItem}>
                      <View style={styles.skeletonHeader}>
                        <Skeleton
                          width={32}
                          height={32}
                          borderRadius={16}
                          style={styles.skeletonAvatar}
                        />
                        <View style={styles.skeletonText}>
                          <Skeleton
                            width={80}
                            height={12}
                            borderRadius={4}
                            style={styles.skeletonName}
                          />
                          <Skeleton width={60} height={10} borderRadius={4} />
                        </View>
                      </View>
                      <View style={styles.skeletonContent}>
                        <Skeleton
                          width="90%"
                          height={12}
                          borderRadius={4}
                          style={styles.skeletonLine}
                        />
                        <Skeleton width="70%" height={12} borderRadius={4} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {!loading && comments.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Feather
                    name="message-circle"
                    size={48}
                    color={mutedText}
                    style={styles.emptyIcon}
                  />
                  <ThemedText style={[styles.emptyText, { color: mutedText }]}>
                    No comments yet
                  </ThemedText>
                  <ThemedText
                    style={[styles.emptySubtext, { color: mutedText }]}
                  >
                    Be the first to share your thoughts!
                  </ThemedText>
                </View>
              )}
              {comments &&
                comments.length > 0 &&
                comments
                  .filter(
                    (item) => item && item.id && typeof item.id === "string"
                  )
                  .map((item) => (
                    <CommentItem
                      key={item.id}
                      item={item}
                      isOwn={profile ? item.user_id === profile.id : false}
                      isAuthor={
                        postCreatorId ? item.user_id === postCreatorId : false
                      }
                      liked={likedComments[item.id] || false}
                      likeCount={likeCounts[item.id] || 0}
                      onLike={() => handleToggleLike(item.id)}
                      onMenu={() => handleMenu(item.id)}
                      formatDate={formatCommentDate}
                    />
                  ))}
            </ScrollView>

            {/* Input Section */}
            <View
              style={[
                styles.inputSection,
                {
                  borderTopColor: borderColor,
                  backgroundColor: backgroundSecondary,
                },
              ]}
            >
              <EmojiBar
                emojis={emojiReactions}
                onEmoji={(e) => setCommentText((prev) => prev + e)}
              />
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

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <ThemedText
                  style={[
                    styles.errorText,
                    {
                      color:
                        textColor === Colors.light.text
                          ? Colors.light.mutedText
                          : Colors.dark.mutedText,
                    },
                  ]}
                >
                  {error}
                </ThemedText>
              </View>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropPressable: {
    flex: 1,
  },
  bottomSheet: {
    height: "90%",
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  commentCount: {
    fontSize: Typography.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  commentList: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skeletonContainer: {
    padding: Spacing.md,
  },
  skeletonItem: {
    marginBottom: Spacing.md,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  skeletonAvatar: {
    marginRight: Spacing.sm,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonName: {
    marginBottom: Spacing.xs,
  },
  skeletonContent: {
    marginLeft: Spacing["2xl"],
  },
  skeletonLine: {
    marginBottom: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.lg,
    fontWeight: Typography.medium,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    textAlign: "center",
  },
  inputSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === "ios" ? Spacing.lg : Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  errorContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.sm,
    textAlign: "center",
  },
});
