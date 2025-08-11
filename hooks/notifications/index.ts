// Main consolidated notifications hook
export { useNotifications } from './useNotifications';

// Specialized variants for specific notification types
export {
    useGeneralNotifications,
    useInteractionNotifications,
    useApplicationNotifications,
    useNotificationOperations
} from './useNotifications';

// Other notification hooks
export { useNotificationSetup } from './useNotificationSetup';

// Types
export type { NotificationConfig } from './useNotifications';
