import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks';
import NotificationBadge from '@/components/ui/NotificationBadge';

interface UniversalHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    showNotifications?: boolean;
    showAddButton?: boolean;
    onAddPress?: () => void;
    rightAction?: {
        icon: string;
        onPress: () => void;
    };
}

export default function UniversalHeader({
    title,
    subtitle,
    showBackButton = false,
    showNotifications = true,
    showAddButton = false,
    onAddPress,
    rightAction,
}: UniversalHeaderProps) {
    const router = useRouter();
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const borderColor = useThemeColor({}, 'border');
    const iconColor = useThemeColor({}, 'icon');

    return (
        <View
            style={[
                styles.header,
                {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: borderColor,
                },
            ]}
        >
            <View style={styles.topRow}>
                <View style={styles.leftSection}>
                    {showBackButton && (
                        <Pressable
                            style={styles.iconButton}
                            onPress={() => router.back()}
                            hitSlop={8}
                        >
                            <Feather name="arrow-left" size={22} color={iconColor} />
                        </Pressable>
                    )}
                    <View style={styles.titleSection}>
                        <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={1}>
                            {title}
                        </ThemedText>
                        {subtitle && (
                            <ThemedText style={[styles.subtitle, { color: mutedTextColor }]} numberOfLines={1}>
                                {subtitle}
                            </ThemedText>
                        )}
                    </View>
                </View>

                <View style={styles.rightSection}>
                    {showAddButton && onAddPress && (
                        <Pressable style={styles.iconButton} onPress={onAddPress} hitSlop={8}>
                            <Feather name="plus" size={22} color={iconColor} />
                        </Pressable>
                    )}
                    {rightAction && (
                        <Pressable style={styles.iconButton} onPress={rightAction.onPress} hitSlop={8}>
                            <Feather name={rightAction.icon as any} size={22} color={iconColor} />
                        </Pressable>
                    )}
                    {showNotifications && (
                        <Pressable
                            style={styles.iconButton}
                            onPress={() => router.push('/notifications')}
                            hitSlop={8}
                        >
                            <View style={styles.bellContainer}>
                                <Feather name="bell" size={22} color={iconColor} />
                                <NotificationBadge />
                            </View>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 10,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 4,
        marginLeft: 12,
    },
    titleSection: {
        flex: 1,
        marginLeft: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    bellContainer: {
        position: 'relative',
    },
});
