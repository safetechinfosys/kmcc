// ===================================
// Supabase Configuration
// ===================================

// TODO: Replace these with your actual Supabase credentials
// Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

export const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // e.g., https://xxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Your anon/public key
};

// INSTRUCTIONS:
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project (wait 2-3 minutes for setup)
// 3. Go to Project Settings > API
// 4. Copy the "Project URL" and paste it as SUPABASE_CONFIG.url above
// 5. Copy the "anon public" key and paste it as SUPABASE_CONFIG.anonKey above
// 6. Save this file
// 7. Run the SQL setup script in Supabase SQL Editor (see setup-database.sql)
