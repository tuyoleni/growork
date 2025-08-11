import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Company } from '../../types/company';
import { Post } from '../../types/posts';
import ScreenContainer from '../../components/ScreenContainer';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ThemedButton from '../../components/ui/ThemedButton';
import { ThemedAvatar } from '../../components/ui/ThemedAvatar';
import ContentCard from '../../components/content/ContentCard';
import { useCompanies } from '@/hooks/companies';
import { usePosts } from '@/hooks/posts';

interface CompanyStats {
    posts: number;
    jobs: number;
    followers: number;
}

export default function CompanyDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    // Removed unused user variable
    const { getCompanyByIdPublic, getCompanyByUserId } = useCompanies();
    const { fetchPostsByCompany } = usePosts();

    const [company, setCompany] = useState<Company | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats] = useState<CompanyStats>({ posts: 0, jobs: 0, followers: 0 });
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Store functions in refs to avoid dependency issues
    const functionsRef = useRef({
        getCompanyByIdPublic,
        getCompanyByUserId,
        fetchPostsByCompany
    });

    // Update refs when functions change
    useEffect(() => {
        functionsRef.current = {
            getCompanyByIdPublic,
            getCompanyByUserId,
            fetchPostsByCompany
        };
    }, [getCompanyByIdPublic, getCompanyByUserId, fetchPostsByCompany]);

    const fetchCompanyDetails = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);

            // Android-specific: Add retry logic for network issues
            const companyData = await withRetry(async () => {
                const { company: companyResult, error } = await functionsRef.current.getCompanyByIdPublic(id);
                if (companyResult && !error) {
                    return companyResult;
                } else {
                    console.error('Company not found or error:', error);
                    throw new Error(error || 'Company not found');
                }
            });

            setCompany(companyData);

            // Fetch posts
            try {
                setPostsLoading(true);
                const { posts: postsData, error: postsError } = await functionsRef.current.fetchPostsByCompany(companyData.id);
                if (!postsError) {
                    setPosts(postsData || []);
                }
            } catch (postsError) {
                console.error('Error fetching posts:', postsError);
            } finally {
                setPostsLoading(false);
            }

        } catch (error: any) {
            console.error('Error fetching company details:', error);

            // Android-specific: Provide more helpful error messages
            let errorMessage = 'Failed to load company details';
            if (error.message.includes('network') || error.message.includes('timeout')) {
                errorMessage = 'Network connection issue. Please check your internet connection and try again.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. Please log in again.';
            } else if (error.message.includes('not found')) {
                errorMessage = 'Company not found. It may have been removed or made private.';
            }

            console.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCompanyDetails();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchCompanyDetails();
    }, [id, fetchCompanyDetails]);

    if (loading) {
        return (
            <ScreenContainer>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                    <ThemedText style={{ marginTop: 16 }}>Loading company details...</ThemedText>
                </View>
            </ScreenContainer>
        );
    }

    if (!company) {
        return (
            <ScreenContainer>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText>Company not found</ThemedText>
                    <ThemedButton title="Go Back" onPress={() => router.back()} />
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Company Header */}
                <ThemedView style={{ padding: 20, alignItems: 'center' }}>
                    <ThemedAvatar
                        size={80}
                        image={company.logo_url || ''}
                    />
                    <ThemedText style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>
                        {company.name}
                    </ThemedText>
                    {company.industry && (
                        <ThemedText style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
                            {company.industry}
                        </ThemedText>
                    )}
                    {company.description && (
                        <ThemedText style={{ textAlign: 'center', marginTop: 16, lineHeight: 22 }}>
                            {company.description}
                        </ThemedText>
                    )}
                </ThemedView>

                {/* Company Stats */}
                <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.posts}</ThemedText>
                        <ThemedText style={{ fontSize: 14, color: '#666' }}>Posts</ThemedText>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.jobs}</ThemedText>
                        <ThemedText style={{ fontSize: 14, color: '#666' }}>Jobs</ThemedText>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.followers}</ThemedText>
                        <ThemedText style={{ fontSize: 14, color: '#666' }}>Followers</ThemedText>
                    </View>
                </ThemedView>

                {/* Company Posts */}
                <ThemedView style={{ padding: 20 }}>
                    <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                        Company Posts
                    </ThemedText>

                    {postsLoading ? (
                        <ActivityIndicator size="small" />
                    ) : posts.length > 0 ? (
                        posts.map((post) => (
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
                                compact={true}
                            />
                        ))
                    ) : (
                        <ThemedText style={{ textAlign: 'center', color: '#666' }}>
                            No posts from this company yet
                        </ThemedText>
                    )}
                </ThemedView>
            </ScrollView>
        </ScreenContainer>
    );
} 