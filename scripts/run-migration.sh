#!/bin/bash

# Database Migration Script
# This script runs the database migration to add missing fields

echo "🚀 Starting database migration..."

# Check if we're in the right directory
if [ ! -f "database-migration.sql" ]; then
    echo "❌ Error: database-migration.sql not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "Please install Supabase CLI first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "📋 Running database migration..."

# Run the migration using Supabase CLI
# You can also run this directly in your Supabase dashboard SQL editor
supabase db push --include-all

echo "✅ Migration completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Check your Supabase dashboard to verify the new fields were added"
echo "2. Test the profile editing functionality in your app"
echo "3. Verify that all fields are saving correctly to the database"
echo ""
echo "🔍 To verify the migration, you can run:"
echo "supabase db diff" 