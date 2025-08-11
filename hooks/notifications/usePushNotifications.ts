import { useState, useCallback } from 'react';
import { checkNotificationPermissions, requestNotificationPermissions } from '@/utils/notifications';

export function usePushNotifications() {
  const [permissions, setPermissions] = useState<NotificationPermission>('default');

  const sendNotification = useCallback(async (title: string, body: string, data?: any) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          data,
          icon: '/favicon.png',
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        return Promise.resolve();
      } else {
        console.warn('Notifications not supported or permission not granted');
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return Promise.reject(error);
    }
  }, []);

  const showLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          data,
          icon: '/favicon.png',
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        return Promise.resolve();
      } else {
        console.warn('Notifications not supported or permission not granted');
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error showing local notification:', error);
      return Promise.reject(error);
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      const granted = await checkNotificationPermissions();
      setPermissions(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const granted = await requestNotificationPermissions();
      setPermissions(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  return {
    sendNotification,
    showLocalNotification,
    checkPermissions,
    requestPermissions,
    permissions,
  };
}
