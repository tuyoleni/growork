import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/ui/useThemeColor';
import { useCompanyPosts } from '@/hooks/posts';

interface CompanyStatsProps {
    companyId: string;
    onPostsPress?: () => void;
    onJobsPress?: () => void;
}

export const CompanyStats: React.FC<CompanyStatsProps> = ({
    companyId,
    onPostsPress,
    onJobsPress,
}) => {
    const { posts } = useCompanyPosts(companyId);
    const mutedTextColor = useThemeColor({}, 'mutedText');

    // Calculate counts from the actual posts data
    const postsCount = posts?.length || 0;
    const jobsCount = posts?.filter(post => post.type === 'job').length || 0;

    return (
        <ThemedView style={styles.container}>
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statItem} onPress={onPostsPress}>
                    <ThemedText style={styles.statNumber}>{postsCount}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>Posts</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statItem} onPress={onJobsPress}>
                    <ThemedText style={styles.statNumber}>{jobsCount}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>Jobs</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
};

const styles = {
    container: {
        paddingVertical: 8,
    },
    statsRow: {
        flexDirection: 'row' as const,
        gap: 24,
    },
    statItem: {
        alignItems: 'center' as const,
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '600' as const,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500' as const,
    },
};
