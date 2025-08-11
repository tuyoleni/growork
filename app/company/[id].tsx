import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    StatusBar,
    useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedButton from '@/components/ui/ThemedButton';
import { ThemedAvatar } from '@/components/ui/ThemedAvatar';
import { ThemedIconButton } from '@/components/ui/ThemedIconButton';
import ScreenContainer from '@/components/ScreenContainer';
import ContentCard from '@/components/content/ContentCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompanyFollows } from '@/hooks/useCompanyFollows';
import { usePosts } from '@/hooks/usePosts';
import { Company } from '@/types/company';
import { Post } from '@/types/posts';
import { useFlashToast } from '@/components/ui/Flash';
import { CompanyDetailsSkeleton } from '@/components/ui/Skeleton';

interface CompanyStats {
    posts: number;
    jobs: number;
    followers: number;
}

export default function CompanyDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { getCompanyByIdPublic, getCompanyStats } = useCompanies();
    const { followCompany, unfollowCompany, isFollowingCompany } = useCompanyFollows();
    const { fetchPostsByUser, fetchPostsByCompany } = usePosts();
    const toast = useFlashToast();
    const colorScheme = useColorScheme();

    const [company, setCompany] = useState<Company | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<CompanyStats>({ posts: 0, jobs: 0, followers: 0 });
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [following, setFollowing] = useState(false);

    // Use refs to store the functions to avoid dependency issues
    const functionsRef = useRef({
        getCompanyByIdPublic,
        getCompanyStats,
        fetchPostsByUser,
        fetchPostsByCompany,
        isFollowingCompany,
        followCompany,
        unfollowCompany,
    });

    // Track if data has been fetched to prevent multiple calls
    const hasFetchedRef = useRef(false);
    const currentIdRef = useRef<string | null>(null);

    // Update refs when functions change
    useEffect(() => {
        functionsRef.current = {
            getCompanyByIdPublic,
            getCompanyStats,
            fetchPostsByUser,
            fetchPostsByCompany,
            isFollowingCompany,
            followCompany,
            unfollowCompany,
        };
    }, [getCompanyByIdPublic, getCompanyStats, fetchPostsByUser, fetchPostsByCompany, isFollowingCompany, followCompany, unfollowCompany]);

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    // Fetch company details
    const fetchCompanyDetails = async () => {
        if (!id) {
            return;
        }

        try {
            setLoading(true);
            hasFetchedRef.current = true;
            currentIdRef.current = id;

            const { company: companyData, error } = await functionsRef.current.getCompanyByIdPublic(id);

            if (companyData && !error) {
                setCompany(companyData);

                // Fetch stats
                try {
                    const statsData = await functionsRef.current.getCompanyStats(companyData.id);
                    setStats(statsData);
                } catch (statsError) {
                    console.error('Error fetching stats:', statsError);
                }

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
            } else {
                console.error('Company not found or error:', error);
                toast.show({
                    type: 'danger',
                    title: 'Error',
                    message: error || 'Company not found',
                });
            }
        } catch (error: any) {
            console.error('Error fetching company details:', error);
            toast.show({
                type: 'danger',
                title: 'Error',
                message: 'Failed to load company details',
            });
        } finally {
            setLoading(false);
        }
    };

    // Check if user is following this company
    const checkFollowingStatus = async () => {
        if (!company || !user) return;

        try {
            const followingStatus = await functionsRef.current.isFollowingCompany(company.id);
            setFollowing(followingStatus);
        } catch (error) {
            setFollowing(false);
        }
    };

    // Handle follow/unfollow toggle
    const handleFollowToggle = async () => {
        if (!company || !user) return;

        try {
            if (following) {
                const result = await functionsRef.current.unfollowCompany(company.id);
                if (result.success) {
                    setFollowing(false);
                    setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
                    toast.show({
                        type: 'success',
                        title: 'Unfollowed',
                        message: `You unfollowed ${company.name}`,
                    });
                } else {
                    throw new Error(result.error);
                }
            } else {
                const result = await functionsRef.current.followCompany(company.id);
                if (result.success) {
                    setFollowing(true);
                    setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
                    toast.show({
                        type: 'success',
                        title: 'Following',
                        message: `You are now following ${company.name}`,
                    });
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (error: any) {
            console.error('Error toggling follow:', error);
            toast.show({
                type: 'danger',
                title: 'Error',
                message: 'Failed to update follow status',
            });
        }
    };

    // Refresh function
    const onRefresh = async () => {
        setRefreshing(true);
        hasFetchedRef.current = false; // Reset the flag for refresh
        await fetchCompanyDetails();
        setRefreshing(false);
    };

    // Load data on mount - only once when id changes
    useEffect(() => {
        if (id && id !== currentIdRef.current) {
            hasFetchedRef.current = false; // Reset for new id
            fetchCompanyDetails();
        }
    }, [id]); // Only depend on id

    // Check following status when company or user changes
    useEffect(() => {
        if (company && user) {
            checkFollowingStatus();
        }
    }, [company?.id, user?.id]); // Only depend on company.id and user.id

    if (loading) {
        return (
            <ScreenContainer>
                <View style={[styles.container, { backgroundColor }]}>
                    <CompanyDetailsSkeleton />
                </View>
            </ScreenContainer>
        );
    }

    if (!company) {
        return (
            <ScreenContainer>
                <View style={[styles.container, { backgroundColor }]}>
                    <ThemedText>Company not found</ThemedText>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View style={[styles.container, { backgroundColor }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <ThemedIconButton
                        icon={<Feather name="arrow-left" size={24} color={textColor} />}
                        onPress={() => router.back()}
                    />
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        {company.name}
                    </ThemedText>
                    <ThemedIconButton
                        icon={<Feather name="more-horizontal" size={24} color={textColor} />}
                        onPress={() => { }}
                    />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Company Info */}
                    <View style={[styles.companyInfoSection, { borderBottomColor: borderColor }]}>
                        <View style={styles.companyInfo}>
                            <ThemedAvatar
                                size={80}
                                image={company.logo_url || ''}
                            />
                            <View style={styles.companyDetails}>
                                <ThemedText style={[styles.companyName, { color: textColor }]}>
                                    {company.name}
                                </ThemedText>
                                {company.industry && (
                                    <ThemedText style={[styles.companyIndustry, { color: textColor }]}>
                                        {company.industry}
                                    </ThemedText>
                                )}
                                {company.location && (
                                    <ThemedText style={[styles.companyLocation, { color: textColor }]}>
                                        📍 {company.location}
                                    </ThemedText>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Company Description */}
                    {company.description && (
                        <View style={[styles.descriptionSection, { borderBottomColor: borderColor }]}>
                            <ThemedText style={[styles.description, { color: textColor }]}>
                                {company.description}
                            </ThemedText>
                        </View>
                    )}

                    {/* Stats */}
                    <View style={[styles.statsSection, { borderBottomColor: borderColor }]}>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                    {stats.posts}
                                </ThemedText>
                                <ThemedText style={[styles.statLabel, { color: textColor }]}>
                                    Posts
                                </ThemedText>
                            </View>
                            <View style={styles.statItem}>
                                <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                    {stats.jobs}
                                </ThemedText>
                                <ThemedText style={[styles.statLabel, { color: textColor }]}>
                                    Jobs
                                </ThemedText>
                            </View>
                            <View style={styles.statItem}>
                                <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                    {stats.followers}
                                </ThemedText>
                                <ThemedText style={[styles.statLabel, { color: textColor }]}>
                                    Followers
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Follow Button - Show for all users except the company owner */}
                    {user && company.user_id !== user.id && (
                        <View style={[styles.followSection, { borderBottomColor: borderColor }]}>
                            <ThemedButton
                                title={following ? 'Unfollow' : 'Follow'}
                                onPress={handleFollowToggle}
                                variant={following ? 'outline' : 'primary'}
                                style={styles.followButton}
                            />
                        </View>
                    )}

                    {/* Posts */}
                    <View style={styles.postsContainer}>
                        <ThemedText style={[styles.postsTitle, { color: textColor }]}>
                            Posts
                        </ThemedText>
                        {postsLoading ? (
                            <ThemedText style={[styles.loadingText, { color: textColor }]}>
                                Loading posts...
                            </ThemedText>
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
                                    showUserProfile={false}
                                    compact={true}
                                />
                            ))
                        ) : (
                            <ThemedText style={[styles.noPostsText, { color: textColor }]}>
                                No posts yet
                            </ThemedText>
                        )}
                    </View>
                </ScrollView>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    companyInfoSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    companyDetails: {
        marginLeft: 16,
        flex: 1,
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    companyIndustry: {
        fontSize: 16,
        marginBottom: 4,
    },
    companyLocation: {
        fontSize: 14,
        opacity: 0.7,
    },
    descriptionSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    statsSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 2,
    },
    followSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    followButton: {
        width: '100%',
    },
    postsContainer: {
        paddingHorizontal: 0,
    },
    postsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    loadingText: {
        textAlign: 'center',
        padding: 20,
    },
    noPostsText: {
        textAlign: 'center',
        padding: 20,
        opacity: 0.7,
    },
}); 