import React from 'react';
import { View, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedButton from '@/components/ui/ThemedButton';
import { useThemeColor } from '@/hooks/ui/useThemeColor';
import { Company } from '@/types/company';

interface CompanyHeaderProps {
    company: Company;
    isFollowing: boolean;
    onFollowToggle: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
    company,
    isFollowing,
    onFollowToggle,
}) => {
    const mutedTextColor = useThemeColor({}, 'mutedText');

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={{
                        uri: company.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=60&background=random`
                    }}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <ThemedText style={styles.name}>{company.name}</ThemedText>
                    {company.industry && (
                        <ThemedText style={[styles.subtitle, { color: mutedTextColor }]}>
                            {company.industry}
                        </ThemedText>
                    )}
                </View>
                <ThemedButton
                    title={isFollowing ? 'Following' : 'Follow'}
                    onPress={onFollowToggle}
                    variant={isFollowing ? 'primary' : 'outline'}
                    size="small"
                    style={styles.followButton}
                />
            </View>
        </ThemedView>
    );
};

const styles = {
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    content: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: '600' as const,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
    },
    followButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
};
