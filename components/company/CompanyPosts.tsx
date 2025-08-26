import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ContentCard from '@/components/content/ContentCard';
import { useCompanyPosts } from '@/hooks/posts';
import { useInteractions } from '@/hooks/posts/useInteractions';

interface CompanyPostsProps {
    companyId: string;
}

export const CompanyPosts: React.FC<CompanyPostsProps> = ({
    companyId,
}) => {
    const { posts, loading, error } = useCompanyPosts(companyId);
    const { initializePosts } = useInteractions();

    // Filter for posts that are either:
    // 1. Job posts (company posts)
    // 2. News posts created by the company
    const companyPosts = posts?.filter(post => {
        // Show job posts (company posts)
        if (post.type === 'job') return true;
        // Show news posts created by the company
        if (post.type === 'news') return true;
        return false;
    }) || [];

    React.useEffect(() => {
        const ids = companyPosts.map(p => p.id as string).filter(Boolean);
        if (ids.length) initializePosts(ids);
    }, [companyPosts, initializePosts]);

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Posts</ThemedText>
                <View style={styles.loadingContainer}>
                    <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Posts</ThemedText>
                <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>
                        Error loading posts
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (companyPosts.length === 0) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Posts</ThemedText>
                <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>
                        No posts yet from this company
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Posts</ThemedText>
            <View style={styles.postsContainer}>
                {companyPosts.map((post: any) => {
                    const profile = post.profiles;
                    const authorName = profile ? `${profile.name ?? ''}${profile.surname ? ' ' + profile.surname : ''}`.trim() : undefined;
                    const authorAvatarUrl = profile?.avatar_url || undefined;

                    return (
                        <ContentCard
                            key={post.id}
                            id={post.id}
                            variant={post.type === 'job' ? 'job' : 'news'}
                            title={post.title || ''}
                            description={post.content || ''}
                            mainImage={post.image_url || undefined}
                            createdAt={post.created_at}
                            criteria={post.criteria || undefined}
                            user_id={post.user_id}
                            authorName={authorName}
                            authorAvatarUrl={authorAvatarUrl}
                            compact={true}
                        />
                    );
                })}
            </View>
        </ThemedView>
    );
};

const styles = {
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600' as const,
        marginBottom: 12,
    },
    postsContainer: {
        gap: 12,
    },
    loadingContainer: {
        alignItems: 'center' as const,
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center' as const,
    },
    emptyState: {
        alignItems: 'center' as const,
        paddingVertical: 50,
    },
    emptyStateText: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center' as const,
    },
};
