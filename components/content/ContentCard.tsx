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
import { supabase } from '@/utils/supabase';
import { useCompanies } from '@/hooks/companies';
import { useRouter } from 'expo-router';

function CompanyHeader({ companyId }: { companyId?: string }) {
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const { getCompanyByIdPublic } = useCompanies();

    useEffect(() => {
        if (companyId) {
            getCompanyByIdPublic(companyId)
                .then(({ company: companyData }) => {
                    if (companyData) setCompany(companyData);
                    setLoading(false);
                });
        }
    }, [companyId]);

    if (loading || !company) {
        return (
            <View style={styles.header}>
                <ThemedAvatar size={32} image="" square={true} />
                <View style={styles.headerText}>
                    <ThemedText style={[styles.name, { color: mutedTextColor }]}>Loading...</ThemedText>
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
function UserHeader({ userId }: { userId?: string }) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileData) setProfile(profileData);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !profile) {
        return (
            <View style={styles.header}>
                <ThemedAvatar size={32} image="" />
                <View style={styles.headerText}>
                    <ThemedText style={[styles.name, { color: mutedTextColor }]}>Loading...</ThemedText>
                </View>
            </View>
        );
    }

    const displayName = `${profile?.name} ${profile?.surname}`;

    return (
        <View style={styles.header}>
            <ThemedAvatar
                size={32}
                image={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=32`}
            />
            <View style={styles.headerText}>
                <View style={styles.nameRow}>
                    <ThemedText style={[styles.name, { color: textColor }]} numberOfLines={1}>
                        {displayName}
                    </ThemedText>
                </View>
                {profile?.profession && (
                    <ThemedText style={[styles.subtitle, { color: mutedTextColor }]} numberOfLines={1}>
                        {profile.profession}
                    </ThemedText>
                )}
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
    style,
    compact = false,
    isSponsored = false,
}: ContentCardProps) {
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
            {/* Header - Specific to post type */}
            <Pressable
                style={styles.headerContainer}
                onPress={variant === 'job' ? handleCompanyPress : handleUserPress}
            >
                {variant === 'job' ? (
                    <CompanyHeader companyId={criteria?.companyId} />
                ) : (
                    <UserHeader userId={user_id} />
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
        height: 200,
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
});