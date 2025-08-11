// Main consolidated application status hook
export { useApplicationStatus } from './useApplicationStatus';

// Specialized variants for backward compatibility
export {
    useApplicationStatusSingle,
    useApplicationStatuses
} from './useApplicationStatus';

// Other application hooks
export { useApplications } from './useApplications';
export { useMyPostApplications } from './useMyPostApplications';

// Types
export type { ApplicationStatusConfig } from './useApplicationStatus';
