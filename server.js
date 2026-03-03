
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'institutional_encryption_key_v4';

// Database Configuration
// Note: In a real environment, use environment variables for these credentials
const pool = new Pool({
  user: process.env.DB_USER || 'asdi_global',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'global_int_banking',
  password: process.env.DB_PASSWORD || 'admin123',
  port: process.env.DB_PORT || 5432,
});

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// 1. Institutional Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Unauthorized Access Node' });

    // In production, use bcrypt.compare
    // For this simulation/demo we check the plaintext or simple hash
    if (password === user.password_hash) {
      const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      res.json({
        token: accessToken,
        user: { name: user.full_name, balance: parseFloat(user.balance) }
      });
    } else {
      res.status(401).json({ message: 'Invalid Credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch User Profile & Balance
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT full_name, balance FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch Transaction History
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC', 
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Authorize Transmission (Atomic Transfer)
app.post('/api/transfer', authenticateToken, async (req, res) => {
  const { 
    amount, currency, recipient, recipientName, 
    type, status, referenceId, paymentReason 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Deduct from balance (Atomic check)
    const updateResult = await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance',
      [amount, req.user.id]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('Insufficient Liquidity for Transmission');
    }

    // 2. Record Transaction
    await client.query(
      `INSERT INTO transactions 
      (user_id, name, amount, currency, type, status, reference_id, recipient_iban, payment_reason) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.user.id, recipientName, amount, currency, type, status, referenceId, recipient, paymentReason]
    );

    await client.query('COMMIT');
    res.json({ success: true, newBalance: updateResult.rows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Global Int Backend running on port ${PORT}`);
});
