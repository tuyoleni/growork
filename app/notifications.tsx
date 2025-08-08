import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIconButton } from '@/components/ui/ThemedIconButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/utils/notifications';
import type { Notification } from '@/types/notifications';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            const data = await getNotifications(user.id);
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const markAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;

        try {
            await markAllNotificationsAsRead(user.id);

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user?.id, fetchNotifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.data?.postId) {
            router.push(`/post/${notification.data.postId}`);
        } else if (notification.data?.applicationId) {
            router.push(`/application/${notification.data.applicationId}`);
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                {
                    backgroundColor: item.read ? backgroundColor : `${backgroundColor}CC`,
                    borderBottomColor: borderColor
                }
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.notificationContent}>
                <ThemedText style={[styles.title, { color: textColor }]}>
                    {item.title}
                </ThemedText>
                <ThemedText style={[styles.body, { color: textColor }]}>
                    {item.body}
                </ThemedText>
                <ThemedText style={[styles.time, { color: textColor }]}>
                    {formatNotificationTime(item.created_at)}
                </ThemedText>
            </View>
            {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: '#007AFF' }]} />
            )}
        </TouchableOpacity>
    );

    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <ScreenContainer>
            <ThemedView style={styles.header}>
                <ThemedIconButton
                    icon={<Ionicons name="arrow-back" size={24} color={textColor} />}
                    onPress={() => router.back()}
                />
                <ThemedText type="title" style={styles.headerTitle}>
                    Notifications
                </ThemedText>
                {notifications.some(n => !n.read) && (
                    <ThemedIconButton
                        icon={<Ionicons name="checkmark-done" size={24} color={textColor} />}
                        onPress={markAllAsRead}
                    />
                )}
            </ThemedView>

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                style={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={textColor}
                    />
                }
                ListEmptyComponent={
                    <ThemedView style={styles.emptyContainer}>
                        <ThemedText style={[styles.emptyText, { color: textColor }]}>
                            {loading ? 'Loading notifications...' : 'No notifications yet'}
                        </ThemedText>
                    </ThemedView>
                }
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    list: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    notificationContent: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        marginBottom: 8,
        opacity: 0.8,
    },
    time: {
        fontSize: 12,
        opacity: 0.6,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 12,
        alignSelf: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.6,
    },
}); 