
-- Global International Banking Database Schema
-- Compatible with PostgreSQL (Recommended)

-- 1. Create the database (Execute this in your PSQL terminal)
-- CREATE DATABASE global_int_banking;

-- 2. Create the Users table
-- Stores institutional account information and current liquidity balance
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(34) UNIQUE NOT NULL,
    balance DECIMAL(20, 2) DEFAULT 1000000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Transactions table
-- Stores all clearing and settlement records
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL, 
    date VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('in', 'out')),
    status VARCHAR(50) NOT NULL,
    reference_id VARCHAR(50) UNIQUE NOT NULL,
    recipient_iban VARCHAR(50),
    payment_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Initial Seed Data
-- Insert the primary Institutional Account (SJ LLC)
-- Use this for testing login
INSERT INTO users (username, password_hash, full_name, account_number, balance)
VALUES (
    'asdi_global', 
    'admin123', 
    'SJ LLC', 
    'DE07300308805230314596', 
    1000000000.00
) ON CONFLICT (username) DO NOTHING;
