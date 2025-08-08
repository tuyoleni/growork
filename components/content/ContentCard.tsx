import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { BadgeCheck } from 'lucide-react-native';
import { ThemedAvatar } from '../ui/ThemedAvatar';
import { ThemedIconButton } from '../ui/ThemedIconButton';
import PostInteractionBar from './PostInteractionBar';
import { useRouter } from 'expo-router';

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
    // Company information (if available)
    company?: {
        id: string;
        name: string;
        logo_url?: string;
        industry?: string;
        location?: string;
        status?: string;
    };
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
    company,
}: ContentCardProps) {
    const router = useRouter();
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const borderColor = useThemeColor({}, 'border');

    // Log company data being displayed
    React.useEffect(() => {
        console.log('=== ContentCard Company Data ===');
        console.log('Company object:', company);
        console.log('Criteria company:', criteria?.company);
        console.log('Company ID:', company?.id || criteria?.companyId);
        console.log('Company name:', company?.name || criteria?.company);
        console.log('Company logo URL:', company?.logo_url);
        console.log('Company industry:', company?.industry);
        console.log('Company location:', company?.location);
        console.log('Company status:', company?.status);
        console.log('==============================');
    }, [company, criteria]);

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
        if (company?.id) {
            router.push(`/profile/CompanyManagement?id=${company.id}`);
        }
    };

    const handleMenuPress = () => {
        // TODO: Implement menu actions
        console.log('Menu pressed');
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

    return (
        <ThemedView style={[styles.container, { borderBottomColor: borderColor + '20' }, style]}>

            {/* Profile Header */}
            {(company || criteria?.company) && (
                <View style={styles.profileHeader}>
                    <Pressable style={styles.profileInfo} onPress={handleCompanyPress}>
                        <ThemedAvatar
                            size={40}
                            image={company?.logo_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || criteria?.company || '')}&size=40`}
                            square={true}
                        />
                        <View style={styles.profileText}>
                            <View style={styles.nameRow}>
                                <ThemedText style={[styles.profileName, { color: textColor }]}>
                                    {company?.name || criteria?.company}
                                </ThemedText>
                                {company?.status === 'approved' && (
                                    <BadgeCheck size={16} color="#3b82f6" style={styles.verifiedIcon} />
                                )}
                            </View>
                            {(company?.industry || company?.location) && (
                                <ThemedText style={[styles.profileSubtitle, { color: mutedTextColor }]}>
                                    {[company?.industry, company?.location].filter(Boolean).join(' • ')}
                                </ThemedText>
                            )}
                        </View>
                    </Pressable>
                    <ThemedIconButton
                        icon={<Feather name="more-horizontal" size={20} color={textColor} />}
                        onPress={handleMenuPress}
                    />
                </View>
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
                    <Pressable
                        style={[styles.actionButton, hasApplied && styles.appliedButton]}
                        onPress={onPressApply}
                        disabled={hasApplied}
                    >
                        <ThemedText style={[styles.actionButtonText, hasApplied && styles.appliedButtonText]}>
                            {hasApplied ? 'Applied' : 'Apply Now'}
                        </ThemedText>
                    </Pressable>
                )}
                {variant === 'news' && (
                    <Pressable style={styles.actionButton} onPress={() => {
                        if (id) {
                            router.push(`/post/${id}`);
                        }
                    }}>
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
    actionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    appliedButton: {
        backgroundColor: '#10b981',
        opacity: 0.8,
    },
    appliedButtonText: {
        color: 'white',
    },
    promotedText: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.6,
    },
});
