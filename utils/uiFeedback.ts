import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

let lastShownAt = 0;
const THROTTLE_MS = 8000; // avoid spamming every retry burst

function shouldShow(): boolean {
  const now = Date.now();
  if (now - lastShownAt > THROTTLE_MS) {
    lastShownAt = now;
    return true;
  }
  return false;
}

export function showNetworkIssue(message: string) {
  try {
    if (!shouldShow()) return;
    Alert.alert('Network issue', message);
  } catch {}
}

export async function notifyNetworkIssue(message: string) {
  try {
    if (!shouldShow()) return;
    await Notifications.presentNotificationAsync({
      title: 'Network issue',
      body: message,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    });
  } catch {}
}

export async function alertAndNotifyNetworkIssue(message: string) {
  // Single gate for both actions so we don't show twice
  if (!shouldShow()) return;
  try { Alert.alert('Network issue', message); } catch {}
  try {
    await Notifications.presentNotificationAsync({
      title: 'Network issue',
      body: message,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    });
  } catch {}
}
