import { useAuth } from '@/hooks/useAuth';
import { UserType } from '@/types/enums';

export type PermissionAction =
    | 'create:post'
    | 'apply:job'
    | 'manage:company'
    | 'view:analytics'
    | string;

export interface Permissions {
    isAuthenticated: boolean;
    isBusinessUser: boolean;
    isRegularUser: boolean;
    userType: UserType | undefined;
    hasUserType: (type: UserType) => boolean;
    can: (action: PermissionAction, resource?: unknown) => boolean;
}

/**
 * Global permissions hook derived from the authenticated user's profile.
 * Use anywhere to drive dynamic UI and feature access.
 */
export function usePermissions(): Permissions {
    const { user, profile } = useAuth();

    const isAuthenticated = Boolean(user);
    const userType = profile?.user_type as UserType | undefined;
    const isBusinessUser = userType === UserType.Business;
    const isRegularUser = userType === UserType.User;

    const hasUserType = (type: UserType) => userType === type;

    const can = (action: PermissionAction): boolean => {
        switch (action) {
            case 'create:post':
            case 'manage:company':
            case 'view:analytics':
                return isBusinessUser;

            case 'apply:job':
                return isAuthenticated; // Allow signed-in users to apply

            default:
                // Unknown actions default to signed-in check
                return isAuthenticated;
        }
    };

    return {
        isAuthenticated,
        isBusinessUser,
        isRegularUser,
        userType,
        hasUserType,
        can,
    };
}

