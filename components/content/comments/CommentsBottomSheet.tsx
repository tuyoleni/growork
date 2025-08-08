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
import { Skeleton } from '@/components/ui/Skeleton';
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useAppContext } from "@/utils/AppContext";
import { ThemedText } from "../../ThemedText";
import { CommentItem } from "./CommentItem";
import { EmojiBar } from "./EmojiBar";
import { CommentsInputBar } from "./CommentsInputBar";
import { Feather } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from "@/constants/Colors";

type LikeMap = Record<string, boolean>;
type CountMap = Record<string, number>;

interface CommentsBottomSheetProps {
    postId: string;
    postOwnerId?: string;
    visible: boolean;
    onClose?: () => void;
}

export default function CommentsBottomSheet({ postId, postOwnerId, visible, onClose }: CommentsBottomSheetProps) {
    const { profile } = useAuth();
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

    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Theme colors
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const mutedText = useThemeColor({}, 'mutedText');
    const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');

    // Keyboard listeners


    useEffect(() => {
        if (visible) {
            // Slide up animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Slide down animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, backdropOpacity]);

    useEffect(() => {
        if (postId && visible) {
            fetchComments(postId);
            setCommentText("");
        }
    }, [postId, visible, fetchComments]);

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
            profile.id,
            commentText,
            {
                id: profile.id,
                avatar_url: profile.avatar_url,
                name: profile.name,
                surname: profile.surname,
                username: profile.username,
            },
            postOwnerId
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

    const handleBackdropPress = () => {
        Keyboard.dismiss();
        onClose?.();
    };

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [600, 0],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose || (() => { })}
        >
            <GestureHandlerRootView style={styles.modalContainer}>
                {/* Backdrop */}
                <Animated.View
                    style={[
                        styles.backdrop,
                        {
                            opacity: backdropOpacity,
                            backgroundColor: textColor === Colors.light.text ? Colors.light.shadow : Colors.dark.shadow
                        }
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
                            shadowColor: textColor === Colors.light.text ? Colors.light.shadow : Colors.dark.shadow,
                        },
                    ]}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                        style={styles.keyboardAvoidingView}
                    >
                        {/* Handle Bar */}
                        <View style={[styles.handleBar, { backgroundColor: borderColor }]} />

                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: borderColor }]}>
                            <View style={styles.headerContent}>
                                <ThemedText style={styles.headerTitle}>Comments</ThemedText>
                                <ThemedText style={[styles.commentCount, { color: mutedText }]}>
                                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                                </ThemedText>
                            </View>
                            <Pressable onPress={onClose || (() => { })} style={styles.closeButton}>
                                <Feather name="x" size={24} color={textColor} />
                            </Pressable>
                        </View>

                        {/* Comments List - Scrollable */}
                        <ScrollView
                            style={styles.commentList}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {loading && (
                                <View style={styles.skeletonContainer}>
                                    {[1, 2, 3].map((index) => (
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
                                    <Feather name="message-circle" size={48} color={mutedText} style={styles.emptyIcon} />
                                    <ThemedText style={[styles.emptyText, { color: mutedText }]}>
                                        No comments yet
                                    </ThemedText>
                                    <ThemedText style={[styles.emptySubtext, { color: mutedText }]}>
                                        Be the first to share your thoughts!
                                    </ThemedText>
                                </View>
                            )}
                            {comments.map((item) => (
                                <CommentItem
                                    key={item.id}
                                    item={item}
                                    isOwn={profile ? item.user_id === profile.id : false}
                                    isAuthor={item.user_id === profile?.id}
                                    liked={likedComments[item.id] || false}
                                    likeCount={likeCounts[item.id] || 0}
                                    onLike={() => handleToggleLike(item.id)}
                                    onMenu={() => handleMenu(item.id)}
                                    formatDate={formatCommentDate}
                                />
                            ))}
                        </ScrollView>

                        {/* Fixed Input Section - Not Scrollable */}
                        <View style={[styles.inputSection, {
                            borderTopColor: borderColor,
                            backgroundColor: backgroundSecondary
                        }]}>
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

                        {/* Error Display */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <ThemedText style={[styles.errorText, {
                                    color: textColor === Colors.light.text ? Colors.light.mutedText : Colors.dark.mutedText
                                }]}>{error}</ThemedText>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </Animated.View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    backdropPressable: {
        flex: 1,
    },
    bottomSheet: {
        maxHeight: '100%',
        minHeight: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
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
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    commentCount: {
        fontSize: 14,
    },
    closeButton: {
        padding: 4,
    },
    commentList: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 8,
        paddingHorizontal: 12,
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
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    inputSection: {
        borderTopWidth: 1,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        paddingHorizontal: 8,
        minHeight: 60,
    },
    errorContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    errorText: {
        fontSize: 14,
        textAlign: "center",
    },
}); 