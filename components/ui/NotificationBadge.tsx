import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/auth/useAuth';
import { useNotifications } from '../../hooks/notifications/useNotifications';

interface NotificationBadgeProps {
  onPress?: () => void;
}

export default function NotificationBadge({ onPress }: NotificationBadgeProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications({ autoFetch: true, realtime: true });

  if (!user || unreadCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.badge}>
      <Text style={styles.badgeText}>
        {unreadCount > 99 ? '99+' : unreadCount.toString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 