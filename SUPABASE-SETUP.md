# Supabase Setup Guide for KMCC Community App

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign Up"**
3. **Sign in with GitHub** (recommended) or use email
4. Verify your email if required

### Step 2: Create a New Project

1. Click **"New Project"** button
2. Fill in the details:
   - **Organization**: Select or create new
   - **Name**: `kmcc-community` (or any name you prefer)
   - **Database Password**: Create a strong password and **SAVE IT**
   - **Region**: Choose closest to your users:
     - India users: Select **"Mumbai (South Asia)"**
     - Other: Select appropriate region
   - **Pricing Plan**: Select **"Free"** (includes 500MB database, 50K monthly active users)
3. Click **"Create new project"**
4. **Wait 2-3 minutes** for the project to be created

### Step 3: Set Up Database Tables

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. **Copy the entire contents** of the `setup-database.sql` file
4. **Paste** it into the SQL editor
5. Click **"Run"** button (or press Ctrl+Enter)
6. You should see: **"Success. No rows returned"**
7. Verify tables were created:
   - Click **"Table Editor"** in left sidebar
   - You should see: `users`, `kids`, `events`, `registrations`

### Step 4: Get Your API Credentials

1. Click the **Settings** icon (gear) in the left sidebar
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **A. Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   Copy this entire URL

   **B. anon public key**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```
   Copy this entire key (it's very long, make sure you copy all of it)

### Step 5: Configure Your App

1. Open the file: `supabase-config.js`
2. Replace the placeholders with your actual values:

   ```javascript
   export const SUPABASE_CONFIG = {
       url: 'https://xxxxxxxxxxxxx.supabase.co',  // Paste your Project URL here
       anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Paste your anon key here
   };
   ```

3. **Save the file**

### Step 6: Test Locally

1. Open terminal in your project folder
2. Run: `npx serve .`
3. Open browser to: `http://localhost:3000`
4. Try creating an account
5. Check Supabase dashboard → Table Editor → users table
6. You should see your new user!

### Step 7: Deploy to GitHub

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Supabase integration"
   git push origin main
   ```

2. Wait 2-3 minutes for GitHub Pages to redeploy
3. Visit: `https://safetechinfosys.github.io/kmcc/`
4. Your app is now live with a real database!

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database tables created (run setup-database.sql)
- [ ] API credentials copied
- [ ] supabase-config.js updated with real credentials
- [ ] App tested locally
- [ ] Changes pushed to GitHub
- [ ] Live app tested

---

## 🎯 What You Get

### Free Tier Includes:
- ✅ **500MB Database** storage
- ✅ **50,000 Monthly Active Users**
- ✅ **2GB File Storage**
- ✅ **Unlimited API requests**
- ✅ **Real-time subscriptions**
- ✅ **Automatic backups** (7 days)

### Features Now Available:
- ✅ **Shared Database**: All users see the same data
- ✅ **Real-time Updates**: Changes sync instantly
- ✅ **Data Persistence**: Data never lost
- ✅ **Search Members**: Find other community members
- ✅ **Event Registration**: Book events with payment tracking
- ✅ **User Profiles**: View and manage profiles

---

## 🔒 Security Features

### Row Level Security (RLS)
Your database is protected with RLS policies:
- Users can only update their own data
- Everyone can view public data (members, events)
- Registrations are protected per user

### API Key Security
- The `anon` key is safe to expose in client-side code
- It only allows operations permitted by RLS policies
- No one can access data they shouldn't

---

## 📊 Managing Your Database

### View Data
1. Go to Supabase Dashboard
2. Click **"Table Editor"**
3. Select a table (users, events, etc.)
4. View, edit, or delete rows

### Add Events
1. Go to **Table Editor** → **events**
2. Click **"Insert row"**
3. Fill in event details
4. Click **"Save"**

### Export Data
1. Go to **Table Editor**
2. Select a table
3. Click **"..."** menu → **"Download as CSV"**

### Backup Database
Supabase automatically backs up your database daily (Free tier: 7 days retention)

---

## 🐛 Troubleshooting

### "Failed to initialize Supabase"
- ✅ Check that `supabase-config.js` has real credentials (not placeholders)
- ✅ Verify Project URL starts with `https://`
- ✅ Verify anon key is complete (very long string)

### "Registration failed"
- ✅ Check browser console for errors (F12)
- ✅ Verify database tables exist in Supabase
- ✅ Check RLS policies are enabled

### "No data showing"
- ✅ Verify you ran `setup-database.sql`
- ✅ Check Table Editor to see if data exists
- ✅ Check browser console for API errors

### "CORS errors"
- ✅ Supabase handles CORS automatically
- ✅ Make sure you're using the correct Project URL
- ✅ Try clearing browser cache

---

## 📞 Support

### Supabase Documentation
- **Getting Started**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript
- **SQL Reference**: https://supabase.com/docs/guides/database

### Community Help
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/safetechinfosys/kmcc/issues

---

## 🎉 You're Done!

Your community app now has:
- ✅ Real PostgreSQL database
- ✅ Shared data across all users
- ✅ Automatic backups
- ✅ Scalable infrastructure
- ✅ Free hosting (GitHub Pages + Supabase)

**Next Steps:**
1. Share the app URL with your community
2. Add more events in Supabase dashboard
3. Monitor usage in Supabase dashboard
4. Enjoy your fully functional community app!

---

*Last Updated: December 2025*
