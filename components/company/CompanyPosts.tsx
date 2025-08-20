import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ContentCard from '@/components/content/ContentCard';
import { Post } from '@/types/posts';

interface CompanyPostsProps {
    posts: Post[];
    isLoading: boolean;
}

export const CompanyPosts: React.FC<CompanyPostsProps> = ({
    posts,
    isLoading,
}) => {
    // Filter for only company posts (job posts)
    const companyPosts = posts.filter(post => post.type === 'job');

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Posts</ThemedText>
                <View style={styles.loadingContainer}>
                    <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
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
                {companyPosts.map((post) => (
                    <ContentCard
                        key={post.id}
                        id={post.id}
                        variant="job"
                        title={post.title || ''}
                        description={post.content || ''}
                        mainImage={post.image_url || undefined}
                        createdAt={post.created_at}
                        criteria={post.criteria || undefined}
                        user_id={post.user_id}
                        compact={true}
                    />
                ))}
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
