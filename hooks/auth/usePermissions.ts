import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { UserType } from '../../types/enums';


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

export function usePermissions(): Permissions & { refresh: () => Promise<void> } {
    const { user, profile, refreshProfile } = useAuth();

    const isAuthenticated = Boolean(user);
    // Safely get and validate the user type
    const userType = (() => {
      const type = profile?.user_type?.toLowerCase();
      if (type === UserType.Business) return UserType.Business;
      if (type === UserType.User) return UserType.User;
      return undefined;
    })();
    
    const isBusinessUser = userType === UserType.Business;
    const isRegularUser = userType === UserType.User;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Profile user_type:', profile?.user_type);
      console.log('Normalized userType:', userType);
      console.log('isBusinessUser:', isBusinessUser, 'isRegularUser:', isRegularUser);
    }

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

    const refresh = useCallback(async () => {
        if (refreshProfile) {
            await refreshProfile();
        }
    }, [refreshProfile]);

    return {
        isAuthenticated,
        isBusinessUser,
        isRegularUser,
        userType,
        hasUserType,
        can,
        refresh,
    };
}

