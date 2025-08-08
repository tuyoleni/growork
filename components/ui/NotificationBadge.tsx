import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/utils/superbase';
import { useAuth } from '@/hooks/useAuth';

interface NotificationBadgeProps {
    size?: number;
    color?: string;
    textColor?: string;
}

export function NotificationBadge({
    size = 20,
    color = '#FF3B30',
    textColor = '#FFFFFF'
}: NotificationBadgeProps) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.id) return;

        const fetchUnreadCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('read', false);

                if (error) {
                    console.error('Error fetching unread count:', error);
                    return;
                }

                setUnreadCount(count || 0);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Set up real-time subscription for unread count
        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    if (unreadCount === 0) {
        return null;
    }

    return (
        <View style={[
            styles.badge,
            {
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: size / 2
            }
        ]}>
            <Text style={[
                styles.text,
                {
                    color: textColor,
                    fontSize: Math.max(10, size * 0.6)
                }
            ]}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 20,
        minHeight: 20,
    },
    text: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
}); 