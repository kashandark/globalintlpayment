
-- Global International Banking Database Schema
-- Optimized for Supabase (PostgreSQL)

-- 1. Profiles Table
-- Stores institutional account information and current liquidity balance
-- This table should be linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    balance DECIMAL(20, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    bank_entity TEXT,
    swift_code TEXT,
    iban TEXT,
    account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactions Table
-- Stores all clearing and settlement records
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    recipient_name TEXT,
    amount TEXT NOT NULL, -- Stored as string to preserve formatting/precision if needed
    currency TEXT NOT NULL,
    type TEXT CHECK (type IN ('in', 'out')),
    status TEXT NOT NULL,
    reference_id TEXT UNIQUE NOT NULL,
    recipient_iban TEXT,
    bic TEXT,
    payment_reason TEXT,
    is_sepa BOOLEAN DEFAULT false,
    timeframe TEXT,
    fee TEXT,
    total_settlement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recipients Table
-- Address book for institutional transfers
CREATE TABLE IF NOT EXISTS recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    iban TEXT NOT NULL,
    bic TEXT NOT NULL,
    account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- 5. Basic RLS Policies (Example: Users can only see their own data)
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- );
