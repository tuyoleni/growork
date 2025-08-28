import React, { useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/ScreenContainer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedIconButton } from "@/components/ui/ThemedIconButton";
import { useThemeColor } from "@/hooks";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import type { Notification } from "@/types/notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const secondaryTextColor = useThemeColor({}, "mutedText");

  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    autoFetch: true,
    realtime: true,
    limit: 50,
  });

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      // Mark as read if unread
      if (!notification.read && markAsRead) {
        await markAsRead(notification.id);
      }

      // Navigate based on notification type
      if (notification.data?.postId) {
        router.push(`/post/${notification.data.postId}`);
      } else if (notification.data?.applicationId) {
        router.push(`/application/${notification.data.applicationId}`);
      } else if (notification.data?.companyId) {
        router.push(`/company/${notification.data.companyId}`);
      }
    },
    [markAsRead, router]
  );

  const formatNotificationTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  }, []);

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.read
              ? backgroundColor
              : `${backgroundColor}CC`,
            borderBottomColor: borderColor,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <ThemedText
            style={[styles.title, { color: textColor }]}
            numberOfLines={2}
          >
            {item.title}
          </ThemedText>
          <ThemedText
            style={[styles.body, { color: secondaryTextColor }]}
            numberOfLines={3}
          >
            {item.body}
          </ThemedText>
          <ThemedText style={[styles.time, { color: secondaryTextColor }]}>
            {formatNotificationTime(item.created_at)}
          </ThemedText>
        </View>

        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: "#007AFF" }]} />
        )}
      </TouchableOpacity>
    ),
    [
      backgroundColor,
      borderColor,
      textColor,
      secondaryTextColor,
      handleNotificationPress,
      formatNotificationTime,
    ]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="notifications-off"
          size={48}
          color={secondaryTextColor}
        />
        <ThemedText style={[styles.emptyText, { color: textColor }]}>
          {loading ? "Loading notifications..." : "No notifications yet"}
        </ThemedText>
      </View>
    ),
    [loading, textColor, secondaryTextColor]
  );

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <ThemedIconButton
            icon={<Ionicons name="arrow-back" size={24} color={textColor} />}
            onPress={() => router.back()}
          />
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: textColor }]}
          >
            Notifications
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            Failed to load notifications
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedIconButton
          icon={<Ionicons name="arrow-back" size={24} color={textColor} />}
          onPress={() => router.back()}
        />

        <ThemedText
          type="title"
          style={[styles.headerTitle, { color: textColor }]}
        >
          Notifications
          {unreadCount > 0 && (
            <ThemedText style={[styles.unreadCount, { color: "#007AFF" }]}>
              {" "}
              ({unreadCount})
            </ThemedText>
          )}
        </ThemedText>

        {unreadCount > 0 && markAllAsRead && (
          <ThemedIconButton
            icon={
              <Ionicons name="checkmark-done" size={20} color={textColor} />
            }
            onPress={markAllAsRead}
          />
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} tintColor={textColor} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  unreadCount: {
    fontSize: 16,
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
