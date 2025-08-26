import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import { BadgeCheck } from 'lucide-react-native';
import { ThemedAvatar } from '../ui/ThemedAvatar';
import ThemedButton from '../ui/ThemedButton';
import PostInteractionBar from './PostInteractionBar';
// Removed direct Supabase calls; author data is passed via props to avoid duplicate fetches
import { useCompanies } from '@/hooks/companies';
import { useRouter } from 'expo-router';

function CompanyHeader({ companyId, companyName }: { companyId: string; companyName?: string }) {
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const { getCompanyById } = useCompanies();

    useEffect(() => {
        console.log('🏢 CompanyHeader: Fetching company with ID:', companyId);
        getCompanyById(companyId)
            .then(({ company: companyData, error }) => {
                if (error) {
                    console.error('❌ CompanyHeader: Error fetching company:', error);
                }
                if (companyData) {
                    console.log('✅ CompanyHeader: Company found:', companyData.name);
                    setCompany(companyData);
                }
                setLoading(false);
            });
    }, [companyId]);

    if (loading) {
        return (
            <View style={styles.header}>
                <View style={[styles.skeletonAvatar, { backgroundColor: mutedTextColor + '20' }]} />
                <View style={styles.headerText}>
                    <View style={[styles.skeletonName, { backgroundColor: mutedTextColor + '20' }]} />
                    <View style={[styles.skeletonSubtitle, { backgroundColor: mutedTextColor + '20' }]} />
                </View>
            </View>
        );
    }

    if (!company) {
        return (
            <View style={styles.header}>
                <ThemedAvatar
                    size={32}
                    image={companyName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=32` : ""}
                    square={true}
                />
                <View style={styles.headerText}>
                    <ThemedText style={[styles.name, { color: textColor }]} numberOfLines={1}>
                        {companyName || 'Unknown Company'}
                    </ThemedText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.header}>
            <ThemedAvatar
                size={32}
                image={company?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name)}&size=32`}
                square={true}
            />
            <View style={styles.headerText}>
                <View style={styles.nameRow}>
                    <ThemedText style={[styles.name, { color: textColor }]} numberOfLines={1}>
                        {company?.name}
                    </ThemedText>
                    {company?.status === 'approved' && <BadgeCheck size={14} color={textColor} />}
                </View>
                {company?.location && (
                    <ThemedText style={[styles.subtitle, { color: mutedTextColor }]} numberOfLines={1}>
                        {company.location}
                    </ThemedText>
                )}
            </View>
        </View>
    );
}

// User Header for News Posts
function UserHeader({ authorName, authorAvatarUrl }: { authorName?: string; authorAvatarUrl?: string }) {
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');

    const displayName = authorName || 'Unknown User';
    const avatar = authorAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=32`;

    return (
        <View style={styles.header}>
            <ThemedAvatar size={32} image={avatar} />
            <View style={styles.headerText}>
                <View style={styles.nameRow}>
                    <ThemedText style={[styles.name, { color: textColor }]} numberOfLines={1}>
                        {displayName}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

export interface ContentCardProps {
    id?: string;
    variant: 'job' | 'news';
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
    authorName?: string;
    authorAvatarUrl?: string;
    style?: any;
    compact?: boolean;
    isSponsored?: boolean;
}

export default function ContentCard({
    id,
    variant,
    title,
    description,
    mainImage,
    criteria,
    onPressApply,
    hasApplied = false,
    user_id,
    authorName,
    authorAvatarUrl,
    style,
    compact = false,
    isSponsored = false,
}: ContentCardProps) {
    console.log('📋 ContentCard: Received props - variant:', variant, 'criteria:', criteria, 'user_id:', user_id);

    const router = useRouter();
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const borderColor = useThemeColor({}, 'border');

    const handlePress = () => {
        if (id) {
            router.push(`/post/${id}`);
        }
    };

    const handleCompanyPress = () => {
        if (criteria?.companyId) {
            router.push(`/company/${criteria.companyId}`);
        }
    };

    const handleUserPress = () => {
        if (user_id) {
            router.push(`/profile`);
        }
    };

    return (
        <ThemedView style={[
            styles.container,
            {
                borderBottomColor: borderColor + '20',
                paddingHorizontal: compact ? 0 : 16,
                paddingVertical: compact ? 12 : 16,
            },
            style
        ]}>
            {/* Header - Show company if available, otherwise show user */}
            <Pressable
                style={styles.headerContainer}
                onPress={criteria?.companyId ? handleCompanyPress : handleUserPress}
            >
                {criteria?.companyId ? (
                    <CompanyHeader companyId={criteria?.companyId} companyName={criteria?.company} />
                ) : (
                    <UserHeader authorName={authorName} authorAvatarUrl={authorAvatarUrl} />
                )}
            </Pressable>

            {/* Content */}
            <Pressable style={styles.contentContainer} onPress={handlePress}>
                {/* Image */}
                {mainImage && (
                    <Image
                        source={{ uri: mainImage }}
                        style={styles.image}
                        contentFit="cover"
                    />
                )}

                {/* Title */}
                <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={2}>
                    {title}
                </ThemedText>

                {/* Description */}
                <ThemedText style={[styles.description, { color: mutedTextColor }]} numberOfLines={3}>
                    {description}
                </ThemedText>

                {/* Key Details - Specific to post type */}
                <View style={styles.details}>
                    {variant === 'job' ? (
                        // Job-specific details
                        <>
                            {criteria?.location && (
                                <View style={styles.detail}>
                                    <Feather name="map-pin" size={12} color={mutedTextColor} />
                                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]} numberOfLines={1}>
                                        {criteria.location}
                                    </ThemedText>
                                </View>
                            )}
                            {criteria?.salary && (
                                <View style={styles.detail}>
                                    <Feather name="dollar-sign" size={12} color={mutedTextColor} />
                                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]} numberOfLines={1}>
                                        {criteria.salary}
                                    </ThemedText>
                                </View>
                            )}
                            {criteria?.jobType && (
                                <View style={styles.detail}>
                                    <Feather name="clock" size={12} color={mutedTextColor} />
                                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]} numberOfLines={1}>
                                        {criteria.jobType}
                                    </ThemedText>
                                </View>
                            )}
                        </>
                    ) : (
                        // News-specific details
                        <>
                            {criteria?.source && (
                                <View style={styles.detail}>
                                    <Feather name="external-link" size={12} color={mutedTextColor} />
                                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]} numberOfLines={1}>
                                        {criteria.source}
                                    </ThemedText>
                                </View>
                            )}
                            {criteria?.publication_date && (
                                <View style={styles.detail}>
                                    <Feather name="calendar" size={12} color={mutedTextColor} />
                                    <ThemedText style={[styles.detailText, { color: mutedTextColor }]} numberOfLines={1}>
                                        {new Date(criteria.publication_date).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </Pressable>

            {/* Actions */}
            <View style={styles.actions}>
                <PostInteractionBar
                    postId={id || ''}
                    postOwnerId={user_id}
                    variant="horizontal"
                    size="small"
                />

                {variant === 'job' && (
                    <ThemedButton
                        title={hasApplied ? 'Applied' : 'Apply'}
                        onPress={onPressApply || (() => { })}
                        disabled={hasApplied}
                        variant={hasApplied ? 'secondary' : 'primary'}
                        size="small"
                    />
                )}
                {variant === 'news' && (
                    <ThemedButton
                        title="Read"
                        onPress={handlePress}
                        variant="primary"
                        size="small"
                    />
                )}
                {isSponsored && (
                    <ThemedText style={[styles.sponsored, { color: mutedTextColor }]}>
                        Sponsored
                    </ThemedText>
                )}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 0.5,
    },
    headerContainer: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerText: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 1,
    },
    contentContainer: {
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 400,
        borderRadius: 8,
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        lineHeight: 20,
    },
    description: {
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 8,
    },
    details: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    detail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sponsored: {
        fontSize: 12,
        fontWeight: '500',
    },
    skeletonAvatar: {
        width: 32,
        height: 32,
        borderRadius: 4,
    },
    skeletonName: {
        height: 14,
        width: 120,
        borderRadius: 2,
        marginBottom: 4,
    },
    skeletonSubtitle: {
        height: 10,
        width: 80,
        borderRadius: 2,
    },
});