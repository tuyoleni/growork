import { supabase } from './supabase';
import type { Profile } from '../types';

/**
 * Creates a profile for a user if one doesn't exist
 * @param userId - The user's ID
 * @param profileData - The profile data to create
 * @returns The created profile or null if error
 */
export async function createProfileIfNotExists(
    userId: string,
    profileData: {
        username: string;
        name: string;
        surname: string;
        user_type?: 'user' | 'business';
    }
): Promise<Profile | null> {
    try {
        // First check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 is "not found" error, which is expected if profile doesn't exist
            console.error('Error checking existing profile:', checkError);
            return null;
        }

        if (existingProfile) {
            console.log('Profile already exists for user:', userId);
            return existingProfile;
        }

        // Create new profile
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                username: profileData.username,
                name: profileData.name,
                surname: profileData.surname,
                user_type: profileData.user_type || 'user',
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating profile:', createError);
            return null;
        }

        console.log('Profile created successfully for user:', userId);
        return newProfile;
    } catch (error) {
        console.error('Error in createProfileIfNotExists:', error);
        return null;
    }
}

/**
 * Ensures a user has a profile, creating one if necessary
 * This is useful for existing users who signed up before the trigger was added
 * @param userId - The user's ID
 * @returns The profile or null if error
 */
export async function ensureUserProfile(userId: string): Promise<Profile | null> {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Profile doesn't exist, try to get user metadata from auth
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error('Error getting user data:', userError);
                    return null;
                }

                // Create profile with available data
                const profileData = {
                    username: user.user_metadata?.username || `user_${userId.slice(0, 8)}`,
                    name: user.user_metadata?.name || '',
                    surname: user.user_metadata?.surname || '',
                    user_type: 'user' as const,
                };

                return await createProfileIfNotExists(userId, profileData);
            } else {
                console.error('Error fetching profile:', error);
                return null;
            }
        }

        return profile;
    } catch (error) {
        console.error('Error in ensureUserProfile:', error);
        return null;
    }
}
