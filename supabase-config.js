// ===================================
// Supabase Configuration
// ===================================

// TODO: Replace these with your actual Supabase credentials
// Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

export const SUPABASE_CONFIG = {
    url: 'https://adoyxecvqfslgyljfqyv.supabase.co', // e.g., https://xxxxx.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb3l4ZWN2cWZzbGd5bGpmcXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjgwNTAsImV4cCI6MjA4MTMwNDA1MH0.0oWdD857hz93u2GjezBPPUVv3VOyThSyUnSguQmRKKI' // Your anon/public key
};

// INSTRUCTIONS:
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project (wait 2-3 minutes for setup)
// 3. Go to Project Settings > API
// 4. Copy the "Project URL" and paste it as SUPABASE_CONFIG.url above
// 5. Copy the "anon public" key and paste it as SUPABASE_CONFIG.anonKey above
// 6. Save this file
// 7. Run the SQL setup script in Supabase SQL Editor (see setup-database.sql)
