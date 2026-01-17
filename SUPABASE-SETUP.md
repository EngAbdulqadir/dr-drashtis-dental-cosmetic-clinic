# 🗄️ Supabase Database Setup Guide (100% Free & Open Source)

## Why Supabase?

✅ **Completely Free** - Generous free tier (500MB database, 50,000 monthly active users)
✅ **Open Source** - Full PostgreSQL database
✅ **No Credit Card Required**
✅ **Real-time** - Automatic updates across devices
✅ **Secure** - Row-level security built-in
✅ **Scalable** - Upgrade when you need more

---

## Step 1: Create Supabase Account

1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. **No credit card required!**

---

## Step 2: Create New Project

1. Click **"New Project"**
2. Fill in details:
   - **Name**: `dr-drashtis-clinic`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., Mumbai for India)
   - **Pricing Plan**: **Free** (selected by default)
3. Click **"Create new project"**
4. Wait 2-3 minutes for database to initialize

---

## Step 3: Create Appointments Table

1. In your Supabase project, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create appointments table
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  place VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(255) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Pending',
  booking_date VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_appointment_datetime 
ON appointments(appointment_date, appointment_time);

-- Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo - customize for production)
CREATE POLICY "Allow all operations" 
ON appointments 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

4. You should see: **"Success. No rows returned"**

---

## Step 4: Get API Credentials

1. Click **"Settings"** (gear icon in sidebar)
2. Click **"API"**
3. Copy these two values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

---

## Step 5: Configure Your Application

1. Open `db-api.js` in your project
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'; // Your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your anon key
```

3. Save the file

---

## Step 6: Test Your Database

1. Open your website
2. Book an appointment
3. Go to Supabase → **Table Editor** → **appointments**
4. You should see your appointment data! 🎉

---

## Features You Get

✅ **Real Database** - PostgreSQL (industry standard)
✅ **Automatic Backups** - Daily backups included
✅ **Real-time Sync** - Changes appear instantly across devices
✅ **Secure** - Industry-standard security
✅ **Scalable** - Handles thousands of appointments
✅ **Free Forever** - For small clinics

---

## Free Tier Limits

- **Database**: 500 MB storage
- **Bandwidth**: 5 GB per month
- **API Requests**: 50,000 per month
- **Users**: Unlimited

**Perfect for a dental clinic!** These limits are more than enough for daily operations.

---

## Upgrade Options (Optional)

If you grow beyond free tier:
- **Pro Plan**: $25/month (8 GB database, 250 GB bandwidth)
- **Team Plan**: $599/month (for large practices)

---

## Security Best Practices

### For Production Use:

1. **Update RLS Policies** (in SQL Editor):
```sql
-- Remove the "Allow all" policy
DROP POLICY "Allow all operations" ON appointments;

-- Add staff-only access (requires authentication)
CREATE POLICY "Staff can manage appointments" 
ON appointments 
FOR ALL 
USING (auth.role() = 'authenticated');
```

2. **Enable Authentication**:
   - Go to: Authentication → Providers
   - Enable Email/Password
   - Update `auth.js` to use Supabase Auth

---

## Troubleshooting

### "Failed to fetch appointments"
- Check your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Verify RLS policies allow access
- Check browser console for errors

### "Table doesn't exist"
- Re-run the SQL from Step 3
- Check table name is exactly `appointments` (lowercase)

### Data not appearing
- Check Supabase → Table Editor → appointments
- Verify RLS policies
- Check browser console for errors

---

## Alternative: Keep Using localStorage

If you prefer to keep data local (no cloud):
- Simply don't configure Supabase
- The app automatically uses localStorage
- Data stays on each device/browser

---

**Your dental clinic now has a professional, free, cloud database! 🚀**

**Supabase Dashboard**: https://supabase.com/dashboard
