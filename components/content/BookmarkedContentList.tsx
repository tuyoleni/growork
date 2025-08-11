import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
// BookmarkedItem interface defined locally since it's no longer exported
interface BookmarkedItem {
    id: string;
    type: 'post' | 'application';
    data: any;
    bookmarked_at: string;
}
import { PostType, ApplicationStatus } from '@/types/enums';
import { Image } from 'expo-image';
import ContentCard from './ContentCard';

interface BookmarkedContentListProps {
    items: BookmarkedItem[];
    subtitle: string;
    onItemPress?: (item: BookmarkedItem) => void;
    onRemoveBookmark?: (item: BookmarkedItem) => void;
    emptyText?: string;
}

export default function BookmarkedContentList({
    items,
    subtitle,
    onItemPress,
    onRemoveBookmark,
    emptyText = 'No bookmarks yet'
}: BookmarkedContentListProps) {
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

    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.Pending:
                return '#fbbf24'; // Yellow
            case ApplicationStatus.Accepted:
                return '#10b981'; // Green
            case ApplicationStatus.Rejected:
                return '#ef4444'; // Red
            case ApplicationStatus.Reviewed:
                return '#3b82f6'; // Blue
            default:
                return mutedTextColor;
        }
    };

    const getStatusIcon = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.Pending:
                return 'clock';
            case ApplicationStatus.Accepted:
                return 'check-circle';
            case ApplicationStatus.Rejected:
                return 'x-circle';
            case ApplicationStatus.Reviewed:
                return 'calendar';
            default:
                return 'help-circle';
        }
    };

    const getPostTypeIcon = (type: PostType) => {
        switch (type) {
            case PostType.Job:
                return 'briefcase';
            case PostType.News:
                return 'file-text';
            default:
                return 'bookmark';
        }
    };

    const renderPostItem = (item: BookmarkedItem) => {
        const post = item.data as any;
        const profile = post.profiles;
        const fullName = profile ? `${profile.name || ''} ${profile.surname || ''}`.trim() : 'User';
        const companyName = post.type === PostType.Job && post.criteria?.company ? post.criteria.company : undefined;
        const newsSource = post.type === PostType.News && (post.criteria?.source || post.criteria?.author)
            ? (post.criteria.source || post.criteria.author)
            : undefined;
        const headerTitle = companyName || newsSource || fullName;
        const avatarImage = post?.image_url
            ? post.image_url
            : companyName
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random&size=40`
                : newsSource
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(newsSource)}&background=random&size=40`
                    : (profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&size=40`);

        return (
            <ContentCard
                key={item.id}
                id={item.id}
                variant={post.type === PostType.Job ? 'job' : 'news'}
                title={post.title || 'Untitled'}
                description={post.content || 'No content'}
                mainImage={post.image_url}
                createdAt={post.created_at}
                criteria={post.criteria || undefined}
                user_id={post.user_id}
            />
        );
    };

    const renderApplicationItem = (item: BookmarkedItem) => {
        const application = item.data as any;
        return (
            <Pressable
                key={item.id}
                style={({ pressed }) => [
                    styles.item,
                    {
                        backgroundColor: pressed ? cardBg : backgroundColor,
                        borderColor: borderColor,
                    }
                ]}
                onPress={() => onItemPress?.(item)}
            >
                <View style={styles.itemHeader}>
                    <View style={styles.itemType}>
                        <Feather name="send" size={16} color={mutedTextColor} />
                        <ThemedText style={[styles.itemTypeText, { color: mutedTextColor }]}>
                            Application
                        </ThemedText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
                        <Feather name={getStatusIcon(application.status)} size={12} color="white" />
                        <ThemedText style={styles.statusText}>
                            {application.status}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.itemContent}>
                    <View style={styles.itemText}>
                        <ThemedText style={[styles.itemTitle, { color: textColor }]} numberOfLines={2}>
                            {application.post?.title || 'Job Application'}
                        </ThemedText>
                        <ThemedText style={[styles.itemSubtitle, { color: mutedTextColor }]} numberOfLines={1}>
                            {application.post?.criteria?.company || 'Company'}
                        </ThemedText>
                        <ThemedText style={[styles.itemDate, { color: mutedTextColor, marginTop: 4 }]}>
                            Applied on {formatDate(application.created_at)}
                        </ThemedText>
                        <View style={styles.applicationDetails}>
                            <View style={styles.detailItem}>
                                <Feather name="file-text" size={12} color={mutedTextColor} />
                                <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                                    Resume attached
                                </ThemedText>
                            </View>
                            {(application.cover_letter || application.cover_letter_id) && (
                                <View style={styles.detailItem}>
                                    <Feather name="message-square" size={12} color={mutedTextColor} />
                                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                                        Cover letter {application.cover_letter_id ? 'document' : 'included'}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <ThemedView style={styles.container}>
            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Feather name="bookmark" size={48} color={mutedTextColor} />
                    <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                        {emptyText}
                    </ThemedText>
                    <ThemedText style={[styles.emptyDescription, { color: mutedTextColor }]}>
                        Start bookmarking content to see it here
                    </ThemedText>
                </View>
            ) : (
                <View style={styles.list}>
                    {items.map(item =>
                        item.type === 'post' ? renderPostItem(item) : renderApplicationItem(item)
                    )}
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    list: {
        gap: 12,
    },
    item: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        gap: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemType: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemTypeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    removeButton: {
        padding: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    itemContent: {
        flexDirection: 'row',
        gap: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    itemText: {
        flex: 1,
        gap: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemSubtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    itemCompany: {
        fontSize: 12,
        fontWeight: '500',
    },
    itemFooter: {
        alignItems: 'flex-end',
    },
    itemDate: {
        fontSize: 12,
    },
    applicationDetails: {
        marginTop: 6,
        gap: 3,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 11,
        fontWeight: '500',
    },
}); 