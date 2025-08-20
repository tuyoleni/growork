# Profile Creation Fix

## Issue

When users register, entries were being added to the `auth.users` table but not to the `profiles` table in Supabase. This caused authentication to work but profile-related functionality to fail.

## Root Cause

The registration flow only called `supabase.auth.signUp()` but didn't create a corresponding profile record in the `profiles` table. There was no database trigger to automatically create profiles when users sign up.

## Solution

### 1. Updated SignUp Function (Immediate Fix)

Modified `utils/AppContext.tsx` to create a profile after successful user registration:

```typescript
// If signup was successful and we have a user, create a profile
if (data?.user?.id) {
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    username,
    name,
    surname,
    user_type: "user",
  });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    // Don't fail the signup if profile creation fails, but log it
    // The user can still verify their email and complete their profile later
  }
}
```

### 2. Database Trigger (Long-term Solution)

Created `database_triggers.sql` with a trigger to automatically create profiles:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, surname, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'surname',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Profile Utility Functions

Created `utils/profileUtils.ts` with utility functions:

- `createProfileIfNotExists()`: Creates a profile if one doesn't exist
- `ensureUserProfile()`: Ensures a user has a profile, creating one if necessary

### 4. Enhanced Profile Fetching

Updated `hooks/auth/useAuthOperations.ts` to automatically create profiles for existing users who don't have one:

```typescript
// If profile doesn't exist, try to create one
if (error.code === "PGRST116") {
  console.log("Profile not found, attempting to create one for user:", userId);
  const createdProfile = await ensureUserProfile(userId);
  if (createdProfile) {
    profileLoaded.current = true;
    return createdProfile;
  }
}
```

## Implementation Steps

1. **For New Users**: The updated signup function will create profiles automatically
2. **For Existing Users**: Run the database trigger SQL in your Supabase SQL editor
3. **For Users Without Profiles**: The enhanced profile fetching will create profiles on-demand

## Testing

1. Register a new user and verify a profile is created
2. Check existing users without profiles - they should get profiles created when they log in
3. Verify all profile-related functionality works correctly

## Files Modified

- `utils/AppContext.tsx` - Updated signUp function
- `hooks/auth/useAuthOperations.ts` - Enhanced profile fetching
- `utils/profileUtils.ts` - New utility functions
- `database_triggers.sql` - Database trigger for automatic profile creation
