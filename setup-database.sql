-- ===================================
-- KMCC Community Registration Database Setup
-- ===================================
-- Run this script in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste this script > Run

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- Users Table
-- ===================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    occupation VARCHAR(255),
    spouse_name VARCHAR(255),
    address TEXT,
    district VARCHAR(100),
    pincode VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- Kids Table
-- ===================================
CREATE TABLE IF NOT EXISTS kids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    school VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- Events Table
-- ===================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    venue VARCHAR(255) NOT NULL,
    adult_rate DECIMAL(10,2) NOT NULL,
    kids_rate DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- Registrations Table
-- ===================================
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_venue VARCHAR(255) NOT NULL,
    adults INTEGER NOT NULL DEFAULT 0,
    kids INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'booked',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- Indexes for Performance
-- ===================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_kids_user_id ON kids(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);

-- ===================================
-- Row Level Security (RLS) Policies
-- ===================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, insert (register), update own data
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Kids: Anyone can read, users can manage their own kids
CREATE POLICY "Kids are viewable by everyone" ON kids FOR SELECT USING (true);
CREATE POLICY "Users can insert their own kids" ON kids FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own kids" ON kids FOR UPDATE USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can delete own kids" ON kids FOR DELETE USING (user_id::text = auth.uid()::text);

-- Events: Everyone can read, admin can manage (for now, everyone can read)
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Anyone can create events" ON events FOR INSERT WITH CHECK (true);

-- Registrations: Everyone can read, users can manage their own
CREATE POLICY "Registrations are viewable by everyone" ON registrations FOR SELECT USING (true);
CREATE POLICY "Users can insert their own registrations" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own registrations" ON registrations FOR UPDATE USING (user_id::text = auth.uid()::text);

-- ===================================
-- Insert Default Events
-- ===================================
INSERT INTO events (name, date, venue, adult_rate, kids_rate, description) VALUES
('Annual Community Gathering 2025', '2025-03-15', 'Community Hall, Ernakulam', 500.00, 250.00, 'Join us for our annual community gathering with cultural programs, food, and networking.'),
('Youth Sports Festival', '2025-04-20', 'Sports Complex, Kottayam', 300.00, 150.00, 'A day of sports activities, competitions, and fun for the whole family.'),
('Cultural Night 2025', '2025-05-10', 'Auditorium, Thiruvananthapuram', 600.00, 300.00, 'An evening of traditional music, dance performances, and cultural celebrations.')
ON CONFLICT DO NOTHING;

-- ===================================
-- Success Message
-- ===================================
SELECT 'Database setup completed successfully!' AS message;
