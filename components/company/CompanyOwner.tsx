import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/ui/useThemeColor';
import { Profile } from '@/types';

interface CompanyOwnerProps {
    owner: Profile;
    onContactPress?: () => void;
}

export const CompanyOwner: React.FC<CompanyOwnerProps> = ({
    owner,
    onContactPress,
}) => {
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const tintColor = useThemeColor({}, 'tint');

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Company Representative</ThemedText>
            <View style={styles.content}>
                <Image
                    source={{
                        uri: owner.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${owner.name || 'User'} ${owner.surname || ''}`)}&size=50`
                    }}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <ThemedText style={styles.name}>
                        {owner.name} {owner.surname}
                    </ThemedText>
                    {owner.profession && (
                        <ThemedText style={[styles.profession, { color: mutedTextColor }]}>
                            {owner.profession}
                        </ThemedText>
                    )}
                </View>
                <TouchableOpacity style={styles.contactButton} onPress={onContactPress}>
                    <Feather name="message-circle" size={18} color={tintColor} />
                </TouchableOpacity>
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
    content: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600' as const,
        marginBottom: 2,
    },
    profession: {
        fontSize: 14,
    },
    contactButton: {
        padding: 8,
    },
};
