import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { ThemedAvatar } from '../ui/ThemedAvatar';
import { ThemedIconButton } from '../ui/ThemedIconButton';
import PostInteractionBar from './PostInteractionBar';
import { useRouter } from 'expo-router';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useAuth } from '@/hooks/useAuth';

export interface ContentCardProps {
    id?: string;
    variant: 'job' | 'news' | 'sponsored';
    title: string;
    postTitle: string;
    username: string;
    name: string;
    avatarImage?: string;
    mainImage?: string;
    description: string;
    badgeText?: string;
    badgeVariant?: 'success' | 'error' | 'warning' | 'info';
    isVerified?: boolean;
    industry?: string;
    onPressApply?: () => void;
    jobId?: string;
    style?: any;
    // Enhanced data fields
    likesCount?: number;
    commentsCount?: number;
    createdAt?: string;
    criteria?: any;
    isSponsored?: boolean;
    isLiked?: boolean;
    isBookmarked?: boolean;
    user_id?: string;
}

export default function ContentCard({
    id,
    variant,
    title,
    postTitle,
    username,
    name,
    avatarImage,
    mainImage,
    description,
    badgeText,
    badgeVariant = 'info',
    isVerified = false,
    industry,
    onPressApply,
    jobId,
    style,
    likesCount = 0,
    commentsCount = 0,
    createdAt,
    criteria,
    isSponsored = false,
    isLiked = false,
    isBookmarked = false,
    user_id,
}: ContentCardProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { showActionSheetWithOptions } = useActionSheet();
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const borderColor = useThemeColor({}, 'border');
    const backgroundColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'backgroundSecondary');



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

    const handleCardPress = () => {
        if (id) {
            router.push(`/post/${id}`);
        }
    };

    const handleProfilePress = () => {
        // Navigate to user profile
        console.log('Navigate to profile:', username);
    };

    const handleMenuPress = () => {
        const isOwner = user?.id === user_id;

        if (!isOwner) return;

        const options = [
            'View Stats',
            'Promote Post',
            'Edit Post',
            'Delete Post',
            'Cancel'
        ];

        const destructiveButtonIndex = 3; // Delete Post
        const cancelButtonIndex = 4; // Cancel

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title: 'Post Options',
                message: 'Choose an action for this post',
            },
            (selectedIndex?: number) => {
                if (selectedIndex === 0) {
                    // View Stats
                    console.log('View stats for post:', id);
                    // TODO: Navigate to stats page
                } else if (selectedIndex === 1) {
                    // Promote Post
                    console.log('Promote post:', id);
                    // TODO: Open promotion modal
                } else if (selectedIndex === 2) {
                    // Edit Post
                    console.log('Edit post:', id);
                    // TODO: Navigate to edit page
                } else if (selectedIndex === 3) {
                    // Delete Post
                    console.log('Delete post:', id);
                    // TODO: Show delete confirmation
                }
            }
        );
    };

    return (
        <ThemedView style={[styles.container, { borderBottomColor: borderColor + '20' }, style]}>
            {/* Header */}
            <Pressable style={styles.header} onPress={handleProfilePress}>
                <ThemedAvatar
                    size={40}
                    image={avatarImage || ''}
                />
                <View style={styles.headerText}>
                    <View style={styles.nameRow}>
                        <ThemedText style={[styles.name, { color: textColor }]} numberOfLines={1}>
                            {name}
                        </ThemedText>
                        {isVerified && (
                            <Feather name="check-circle" size={16} color="#3b82f6" style={styles.verifiedIcon} />
                        )}
                    </View>
                    <ThemedText style={[styles.username, { color: mutedTextColor }]} numberOfLines={1}>
                        @{username}
                    </ThemedText>
                </View>
                {industry && (
                    <ThemedText style={[styles.industryText, { color: mutedTextColor }]}>
                        {industry}
                    </ThemedText>
                )}
                {user?.id === user_id && (
                    <ThemedIconButton
                        icon={<Feather name="more-horizontal" size={20} color={textColor} />}
                        onPress={handleMenuPress}
                    />
                )}
            </Pressable>

            {/* Content */}
            <Pressable style={styles.content} onPress={handleCardPress}>


                <ThemedText style={[styles.postTitle, { color: textColor }]} numberOfLines={3}>
                    {postTitle}
                </ThemedText>

                {mainImage && (
                    <Image
                        source={{ uri: mainImage }}
                        style={styles.mainImage}
                        contentFit="cover"
                    />
                )}

                <ThemedText style={[styles.description, { color: mutedTextColor }]} numberOfLines={4}>
                    {description}
                </ThemedText>

                {/* Job-specific details */}
                {variant === 'job' && criteria && (
                    <View style={styles.jobDetails}>
                        {criteria.company && (
                            <View style={styles.jobDetail}>
                                <Feather name="briefcase" size={14} color={mutedTextColor} />
                                <ThemedText style={[styles.jobDetailText, { color: mutedTextColor }]}>
                                    {criteria.company}
                                </ThemedText>
                            </View>
                        )}
                        {criteria.location && (
                            <View style={styles.jobDetail}>
                                <Feather name="map-pin" size={14} color={mutedTextColor} />
                                <ThemedText style={[styles.jobDetailText, { color: mutedTextColor }]}>
                                    {criteria.location}
                                </ThemedText>
                            </View>
                        )}
                        {criteria.salary && (
                            <View style={styles.jobDetail}>
                                <Feather name="dollar-sign" size={14} color={mutedTextColor} />
                                <ThemedText style={[styles.jobDetailText, { color: mutedTextColor }]}>
                                    {criteria.salary}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                )}

                {/* News-specific details */}
                {variant === 'news' && criteria && (
                    <View style={styles.newsDetails}>
                        {criteria.source && (
                            <View style={styles.newsDetail}>
                                <Feather name="external-link" size={14} color={mutedTextColor} />
                                <ThemedText style={[styles.newsDetailText, { color: mutedTextColor }]}>
                                    {criteria.source}
                                </ThemedText>
                            </View>
                        )}
                        {criteria.publication_date && (
                            <View style={styles.newsDetail}>
                                <Feather name="calendar" size={14} color={mutedTextColor} />
                                <ThemedText style={[styles.newsDetailText, { color: mutedTextColor }]}>
                                    {formatDate(criteria.publication_date)}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                )}



                {/* Timestamp */}
                {createdAt && (
                    <ThemedText style={[styles.timestamp, { color: mutedTextColor }]}>
                        {formatDate(createdAt)}
                    </ThemedText>
                )}
            </Pressable>

            {/* Action Row */}
            <View style={styles.actionRow}>
                <PostInteractionBar
                    postId={id || ''}
                    variant="horizontal"
                    size="medium"
                />
                {variant === 'job' && (
                    <Pressable style={styles.actionButton} onPress={onPressApply}>
                        <ThemedText style={styles.actionButtonText}>Apply Now</ThemedText>
                    </Pressable>
                )}
                {variant === 'news' && (
                    <Pressable style={styles.actionButton} onPress={handleCardPress}>
                        <ThemedText style={styles.actionButtonText}>Read More</ThemedText>
                    </Pressable>
                )}
                {variant === 'sponsored' && (
                    <ThemedText style={[styles.promotedText, { color: mutedTextColor }]}>Promoted</ThemedText>
                )}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 0.5,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        marginRight: 4,
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    username: {
        fontSize: 13,
        opacity: 0.6,
    },
    userDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },


    content: {
        marginBottom: 12,
    },
    postTitle: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 22,
        marginBottom: 8,
    },
    mainImage: {
        width: '100%',
        height: 240,
        borderRadius: 12,
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 8,
    },
    jobDetails: {
        marginBottom: 8,
    },
    jobDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    jobDetailText: {
        fontSize: 14,
        marginLeft: 6,
    },
    newsDetails: {
        gap: 8,
    },
    newsDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    newsDetailText: {
        fontSize: 14,
    },
    industryTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    industryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
    },

    actionButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    promotedText: {
        fontSize: 12,
        fontWeight: '500',
    },
}); 