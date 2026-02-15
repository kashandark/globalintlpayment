
-- Global International Banking Database Schema
-- Compatible with PostgreSQL or MySQL

CREATE DATABASE global_int_banking;

-- Table for users/accounts
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(34) UNIQUE NOT NULL,
    balance DECIMAL(20, 2) DEFAULT 1000000000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for transaction history
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL, -- Name of the institution or beneficiary
    date VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('in', 'out')),
    status VARCHAR(50) NOT NULL,
    reference_id VARCHAR(50) UNIQUE NOT NULL,
    recipient_iban VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a mock administrator user
-- Password for demo purposes: admin123 (In production, use bcrypt/argon2)
INSERT INTO users (username, password_hash, full_name, account_number, balance)
VALUES ('asdi_global', 'admin123', 'Global International Liquidity', 'DE64300308806131122888', 100000000000.00);
