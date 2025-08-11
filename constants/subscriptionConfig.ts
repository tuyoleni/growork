// Subscription configuration constants
export const SUBSCRIPTION_CONFIG = {
  // Real-time subscription timeout (ms)
  SUBSCRIPTION_TIMEOUT: 15000,
  
  // Retry delay for failed subscriptions (ms)
  RETRY_DELAY: 10000,
  
  // Maximum retry attempts
  MAX_RETRIES: 1,
  
  // Polling interval as fallback (ms)
  POLLING_INTERVAL: 30000,
  
  // Profile subscription timeout (ms)
  PROFILE_SUBSCRIPTION_TIMEOUT: 10000,
} as const;
