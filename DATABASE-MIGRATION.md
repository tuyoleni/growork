# Database Migration Guide

## Overview

This migration adds missing fields to the `profiles` table to support the new native settings system and ensure consistency between the database schema and TypeScript interfaces.

## What's Changed

### Added Fields to `profiles` Table

The following fields have been added to support the native settings functionality:

| Field              | Type                       | Description                       | Used For                      |
| ------------------ | -------------------------- | --------------------------------- | ----------------------------- |
| `updated_at`       | `timestamp with time zone` | Last update timestamp             | Tracking profile changes      |
| `website`          | `text`                     | User's website URL                | Professional/Company profiles |
| `phone`            | `text`                     | User's phone number               | Contact information           |
| `location`         | `text`                     | User's location (city, country)   | Contact information           |
| `profession`       | `text`                     | User's profession or company name | Professional/Company profiles |
| `experience_years` | `integer`                  | Years of experience               | Professional profiles         |
| `education`        | `text`                     | Education background              | Professional profiles         |
| `skills`           | `text[]`                   | Array of skills                   | Professional profiles         |

### Database Triggers

- Added `set_profiles_updated_at` trigger to automatically update the `updated_at` timestamp when profiles are modified

### Performance Indexes

- `idx_profiles_user_type` - Index on user_type for faster filtering
- `idx_profiles_username` - Index on username for faster lookups
- `idx_companies_user_id` - Index on companies.user_id for faster joins
- `idx_companies_status` - Index on companies.status for faster filtering

## How to Run the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root directory
cd /path/to/your/project

# Run the migration script
./scripts/run-migration.sh
```

### Option 2: Manual Migration

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-migration.sql`
4. Run the script

### Option 3: Using Supabase CLI Directly

```bash
# Push the migration to your database
supabase db push --include-all

# Or run the migration file directly
supabase db reset
```

## Verification

After running the migration, verify that:

1. **New fields exist**: Check that all new fields are present in the `profiles` table
2. **Triggers work**: Update a profile and verify `updated_at` is automatically updated
3. **App functionality**: Test the profile editing in your app
4. **Data consistency**: Ensure all profile data is saving correctly

### SQL Verification Commands

```sql
-- Check if new fields exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles';
```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove the new fields (WARNING: This will delete data)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS website;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS location;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS profession;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS experience_years;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS education;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS skills;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS updated_at;

-- Remove the trigger
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

-- Remove indexes
DROP INDEX IF EXISTS idx_profiles_user_type;
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_companies_user_id;
DROP INDEX IF EXISTS idx_companies_status;
```

## Impact on Existing Data

- **No data loss**: Existing profiles will retain all current data
- **New fields**: Will be `NULL` for existing profiles until updated
- **Backward compatibility**: The app will continue to work with existing profiles
- **Performance**: New indexes will improve query performance

## TypeScript Interface Alignment

The database schema now matches the TypeScript interfaces:

```typescript
// types/profile.ts
export interface Profile {
  id: string;
  username: string | null;
  name: string;
  surname: string;
  avatar_url: string | null;
  bio: string | null;
  user_type: UserType;
  website: string | null; // ✅ Added
  phone: string | null; // ✅ Added
  location: string | null; // ✅ Added
  profession: string | null; // ✅ Added
  experience_years: number | null; // ✅ Added
  education: string | null; // ✅ Added
  skills: string[] | null; // ✅ Added
  created_at: string;
  updated_at: string | null; // ✅ Added
}
```

## Next Steps

1. **Test the migration** in a development environment first
2. **Update your app** to use the new fields
3. **Test profile editing** functionality
4. **Monitor performance** with the new indexes
5. **Update documentation** for your team

## Support

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify your database connection
3. Ensure you have the necessary permissions
4. Test with a small subset of data first
