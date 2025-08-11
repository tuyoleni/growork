import { RealtimeChannel } from '@supabase/supabase-js';

// Utility to safely cleanup subscriptions
export const cleanupSubscription = (subscription: RealtimeChannel | null) => {
  if (subscription) {
    try {
      subscription.unsubscribe();
    } catch (error) {
      console.warn('Error cleaning up subscription:', error);
    }
  }
  return null;
};

// Utility to safely cleanup intervals
export const cleanupInterval = (interval: ReturnType<typeof setInterval> | null) => {
  if (interval) {
    try {
      clearInterval(interval);
    } catch (error) {
      console.warn('Error cleaning up interval:', error);
    }
  }
  return null;
};

// Utility to safely cleanup timeouts
export const cleanupTimeout = (timeout: ReturnType<typeof setTimeout> | null) => {
  if (timeout) {
    try {
      clearTimeout(timeout);
    } catch (error) {
      console.warn('Error cleaning up timeout:', error);
    }
  }
  return null;
};
