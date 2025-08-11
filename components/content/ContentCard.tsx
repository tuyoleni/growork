import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import { BadgeCheck } from 'lucide-react-native';
import { ThemedAvatar } from '../ui/ThemedAvatar';
import { ThemedIconButton } from '../ui/ThemedIconButton';
import ThemedButton from '../ui/ThemedButton';
import PostInteractionBar from './PostInteractionBar';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useCompanies } from '@/hooks/companies';

// UserProfileHeader component
function UserProfileHeader({ userId }: { userId: string }) {
    const [profile, setProfile] = useState<any>(null);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const router = useRouter();

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);

            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!profileError && profileData) {
                setProfile(profileData);

                // If it's a business account, fetch company status
                if (profileData.user_type === 'business') {
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('status')
                        .eq('user_id', userId)
                        .single();

                    if (!companyError && companyData) {
                        setCompanyStatus(companyData.status);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePress = () => {
        if (profile?.id) {
            // Navigate to the current user's profile since there's no dynamic route
            router.push(`/profile`);
        }
    };

    if (loading || !profile) {
        return (
            <View style={styles.profileHeader}>
                <View style={styles.profileInfo}>
                    <ThemedAvatar size={40} image="" />
                    <View style={styles.profileText}>
                        <View style={styles.nameRow}>
                            <ThemedText style={[styles.profileName, { color: mutedTextColor }]}>
                                Loading...
                            </ThemedText>
                        </View>
                    </View>
                </View>
                <ThemedIconButton
                    icon={<Feather name="more-horizontal" size={20} color={mutedTextColor} />}
                    onPress={() => { }}
                />
            </View>
        );
    }

    const getCompanyBadgeStyle = () => {
        switch (companyStatus) {
            case 'approved':
                return { backgroundColor: '#10b981', color: '#ffffff' };
            case 'pending':
                return { backgroundColor: '#f59e0b', color: '#ffffff' };
            case 'rejected':
                return { backgroundColor: '#ef4444', color: '#ffffff' };
            default:
                return { backgroundColor: '#6b7280', color: '#ffffff' };
        }
    };

    const getCompanyBadgeText = () => {
        switch (companyStatus) {
            case 'approved':
                return '✓ Approved';
            case 'pending':
                return '⏳ Pending';
            case 'rejected':
                return '✗ Rejected';
            default:
                return 'No Company';
        }
    };

    return (
        <View style={styles.profileHeader}>
            <Pressable style={styles.profileInfo} onPress={handleProfilePress}>
                <ThemedAvatar
                    size={40}
                    image={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&size=40`}
                />
                <View style={styles.profileText}>
                    <View style={styles.nameRow}>
                        <ThemedText style={[styles.profileName, { color: textColor }]}>
                            {profile.name} {profile.surname}
                        </ThemedText>
                        {profile.username && (
                            <ThemedText style={[styles.profileUsername, { color: mutedTextColor }]}>
                                @{profile.username}
                            </ThemedText>
                        )}
                    </View>
                    <View style={styles.profileSubInfo}>
                        <ThemedText style={[styles.profileSubtitle, { color: mutedTextColor }]}>
                            {profile.user_type === 'business' ? 'Business Account' : 'Personal Account'}
                        </ThemedText>
                        {profile.user_type === 'business' && companyStatus && (
                            <View style={[styles.companyBadge, getCompanyBadgeStyle()]}>
                                <ThemedText style={[styles.badgeText, { color: getCompanyBadgeStyle().color }]}>
                                    {getCompanyBadgeText()}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
            <ThemedIconButton
                icon={<Feather name="more-horizontal" size={20} color={textColor} />}
                onPress={() => { }}
            />
        </View>
    );
}

export interface ContentCardProps {
    id?: string;
    variant: 'job' | 'news' | 'sponsored';
    title: string;
    description: string;
    mainImage?: string;
    createdAt?: string;
    criteria?: {
        companyId?: string;
        company?: string;
        location?: string;
        salary?: string;
        jobType?: string;
        source?: string;
        publication_date?: string;
    };
    isVerified?: boolean;
    onPressApply?: () => void;
    hasApplied?: boolean;
    user_id?: string;
    style?: any;
    compact?: boolean;
}

export default function ContentCard({
    id,
    variant,
    title,
    description,
    mainImage,
    createdAt,
    criteria,
    isVerified = false,
    onPressApply,
    hasApplied = false,
    user_id,
    style,
    compact = false, // Default to false for backward compatibility
}: ContentCardProps) {
    const router = useRouter();
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const borderColor = useThemeColor({}, 'border');
    const { getCompanyByIdPublic } = useCompanies();
    const [company, setCompany] = useState<any>(null);

    // Fetch company data when companyId is available
    useEffect(() => {
        if (criteria?.companyId) {
            getCompanyByIdPublic(criteria.companyId)
                .then(({ company: companyData, error }) => {
                    if (companyData && !error) {
                        setCompany(companyData);
                    }
                })
                .catch(console.error);
        }
    }, [criteria?.companyId, getCompanyByIdPublic]);

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

    const handleCompanyPress = () => {
        if (criteria?.companyId) {
            router.push(`/company/${criteria.companyId}`);
        }
    };

    const handleMenuPress = () => {
        if (id) {
            router.push(`/post/${id}`);
        }
    };

    const handleReadMore = () => {
        if (id) {
            router.push(`/post/${id}`);
        }
    };

    // Helper functions for company status
    const getCompanyStatusStyle = (status: string) => {
        switch (status) {
            case 'approved':
                return { backgroundColor: '#10b981', color: '#ffffff' };
            case 'pending':
                return { backgroundColor: '#f59e0b', color: '#ffffff' };
            case 'rejected':
                return { backgroundColor: '#ef4444', color: '#ffffff' };
            default:
                return { backgroundColor: '#6b7280', color: '#ffffff' };
        }
    };

    const getCompanyStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return '✓ Approved';
            case 'pending':
                return '⏳ Pending';
            case 'rejected':
                return '✗ Rejected';
            default:
                return 'Unknown';
        }
    };

    const renderDetails = () => {
        if (!criteria) return null;

        const details = [];
        const uniqueId = id || `card-${title}-${variant}`;

        // Location
        if (criteria.location) {
            details.push(
                <View key={`${uniqueId}-location`} style={styles.detailRow}>
                    <Feather name="map-pin" size={14} color={mutedTextColor} />
                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                        {criteria.location}
                    </ThemedText>
                </View>
            );
        }

        // Job-specific details
        if (variant === 'job') {
            if (criteria.salary) {
                details.push(
                    <View key={`${uniqueId}-salary`} style={styles.detailRow}>
                        <Feather name="dollar-sign" size={14} color={mutedTextColor} />
                        <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                            {criteria.salary}
                        </ThemedText>
                    </View>
                );
            }
            if (criteria.jobType) {
                details.push(
                    <View key={`${uniqueId}-jobType`} style={styles.detailRow}>
                        <Feather name="clock" size={14} color={mutedTextColor} />
                        <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                            {criteria.jobType}
                        </ThemedText>
                    </View>
                );
            }
        }

        // News-specific details
        if (variant === 'news') {
            if (criteria.source) {
                details.push(
                    <View key={`${uniqueId}-source`} style={styles.detailRow}>
                        <Feather name="external-link" size={14} color={mutedTextColor} />
                        <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                            {criteria.source}
                        </ThemedText>
                    </View>
                );
            }
            if (criteria.publication_date) {
                details.push(
                    <View key={`${uniqueId}-date`} style={styles.detailRow}>
                        <Feather name="calendar" size={14} color={mutedTextColor} />
                        <ThemedText style={[styles.detailText, { color: mutedTextColor }]}>
                            {formatDate(criteria.publication_date)}
                        </ThemedText>
                    </View>
                );
            }
        }

        return <View style={styles.detailsContainer}>{details}</View>;
    };

    // Show company header if company data exists
    const shouldShowCompanyHeader = company?.id;

    return (
        <ThemedView style={[
            styles.container,
            {
                borderBottomColor: borderColor + '20',
                paddingHorizontal: compact ? 0 : 16,
                paddingVertical: compact ? 8 : 16,
            },
            style
        ]}>

            {/* Company Header - Show when company data is available */}
            {shouldShowCompanyHeader && (
                <View style={styles.profileHeader}>
                    <Pressable style={styles.profileInfo} onPress={handleCompanyPress}>
                        <ThemedAvatar
                            size={40}
                            image={company?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || '')}&size=40`}
                            square={true}
                        />
                        <View style={styles.profileText}>
                            <View style={styles.nameRow}>
                                <ThemedText style={[styles.profileName, { color: textColor }]}>
                                    {company?.name}
                                </ThemedText>
                                {company?.status === 'approved' && (
                                    <BadgeCheck size={16} color={textColor} style={styles.verifiedIcon} />
                                )}
                            </View>
                            {/* Website link if available */}
                            {company?.website && (
                                <Pressable onPress={() => company.website && Linking.openURL(company.website)}>
                                    <ThemedText style={[styles.websiteLink, { color: mutedTextColor }]} numberOfLines={1}>
                                        🌐 {company.website.replace(/^https?:\/\//, '')}
                                    </ThemedText>
                                </Pressable>
                            )}
                            {/* Company description if available */}
                            {company?.description && (
                                <ThemedText style={[styles.companyDescription, { color: mutedTextColor }]} numberOfLines={2}>
                                    {company.description}
                                </ThemedText>
                            )}
                            <View style={styles.companySubInfo}>
                                {/* Primary company info - industry and location */}
                                {(company?.industry || company?.location) && (
                                    <ThemedText style={[styles.profileSubtitle, { color: mutedTextColor }]}>
                                        {[company?.industry, company?.location].filter(Boolean).join(' • ')}
                                    </ThemedText>
                                )}
                                {/* Company status badge */}
                                {company?.status && (
                                    <View style={[styles.companyStatusBadge, getCompanyStatusStyle(company.status)]}>
                                        <ThemedText style={[styles.statusBadgeText, { color: getCompanyStatusStyle(company.status).color }]}>
                                            {getCompanyStatusText(company.status)}
                                        </ThemedText>
                                    </View>
                                )}
                                {/* Secondary company info - size and founded year */}
                                {(company?.size || company?.founded_year) && (
                                    <ThemedText style={[styles.companySecondaryInfo, { color: mutedTextColor }]}>
                                        {[
                                            company?.size && `Size: ${company.size}`,
                                            company?.founded_year && `Founded: ${company.founded_year}`
                                        ].filter(Boolean).join(' • ')}
                                    </ThemedText>
                                )}
                            </View>
                        </View>
                    </Pressable>
                    <ThemedIconButton
                        icon={<Feather name="more-horizontal" size={20} color={textColor} />}
                        onPress={handleMenuPress}
                    />
                </View>
            )}

            {/* User Profile Header - Only show when no company data is available */}
            {!shouldShowCompanyHeader && user_id && (
                <UserProfileHeader userId={user_id} />
            )}

            {/* Main Image */}
            {mainImage && (
                <Image
                    source={{ uri: mainImage }}
                    style={styles.mainImage}
                    contentFit="cover"
                />
            )}

            {/* Content */}
            <View style={styles.content}>
                <ThemedText style={[styles.description, { color: textColor }]} numberOfLines={4}>
                    {description}
                </ThemedText>

                {renderDetails()}
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
                <PostInteractionBar
                    postId={id || ''}
                    postOwnerId={user_id}
                    variant="horizontal"
                    size="medium"
                />
                {variant === 'job' && (
                    <ThemedButton
                        title={hasApplied ? 'Applied' : 'Apply Now'}
                        onPress={onPressApply || (() => { })}
                        disabled={hasApplied}
                        variant={hasApplied ? 'secondary' : 'primary'}
                        size="medium"
                    />
                )}
                {variant === 'news' && (
                    <ThemedButton
                        title="Read More"
                        onPress={handleReadMore}
                        variant="primary"
                        size="medium"
                    />
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
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    profileText: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    profileSubtitle: {
        fontSize: 12,
        opacity: 0.7,
    },
    mainImage: {
        width: '100%',
        height: 384,
        borderRadius: 4,
        marginBottom: 12,
    },
    content: {
        marginBottom: 12,
        gap: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 20,
    },
    detailsContainer: {
        marginTop: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
        gap: 6,
    },
    detailText: {
        fontSize: 13,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promotedText: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.6,
    },
    profileUsername: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    profileSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    companyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    companySubInfo: {
        marginTop: 4,
        gap: 4,
    },
    companySecondaryInfo: {
        fontSize: 11,
        opacity: 0.6,
        marginTop: 2,
    },
    companyStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    websiteLink: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
        textDecorationLine: 'underline',
    },
    companyDescription: {
        fontSize: 12,
        marginTop: 4,
    },
});