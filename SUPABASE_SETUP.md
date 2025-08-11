# Supabase Setup

## Configuration Required

To fix the "No API key found in request" error, you need to configure your Supabase credentials using environment variables.

### Steps:

1. Create a `.env` file in your project root (if it doesn't exist)
2. Go to your Supabase project dashboard
3. Navigate to Settings > API
4. Copy your Project URL and anon/public key
5. Add these to your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key-here
```

### Important:

- Never commit your `.env` file to version control (add it to `.gitignore`)
- The anon key is safe to use in client-side code
- Restart your development server after adding environment variables

### Note:

Make sure your `.env` file is in the project root and contains the exact variable names shown above.
