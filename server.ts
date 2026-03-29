
import express from 'express';
import { createServer as createViteServer, loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually if it exists
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('.env file found at:', envPath);
  dotenv.config({ path: envPath });
} else {
  console.warn('.env file NOT found at:', envPath);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load environment variables from .env files using Vite's loadEnv
  const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
  
  // Try to get credentials from multiple sources
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  let supabaseAdmin: any = null;

  const isValid = (val: any) => {
    if (!val) return false;
    if (typeof val !== 'string') return false;
    if (val === 'undefined' || val === 'null' || val.trim() === '') return false;
    return true;
  };

  console.log('Checking Supabase credentials for admin operations...');
  
  if (isValid(supabaseUrl) && isValid(serviceRoleKey)) {
    try {
      supabaseAdmin = createClient(
        supabaseUrl!.trim(),
        serviceRoleKey!.trim(),
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log('Supabase admin client initialized successfully.');
    } catch (err: any) {
      console.error('Error initializing Supabase admin client:', err.message);
    }
  } else {
    console.warn('Supabase credentials missing or invalid for server-side admin operations.');
    console.warn('URL present:', !!supabaseUrl);
    console.warn('Key present:', !!serviceRoleKey);
    console.warn('Admin routes will be disabled.');
  }

  // Middleware to verify admin role
  const verifyAdmin = async (req: any, res: any, next: any) => {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Supabase admin client not configured.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // Check role in profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  };

  // API Route: Admin Update User
  app.post('/api/admin/update-user', verifyAdmin, async (req, res) => {
    const { userId, email, password, full_name } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
      // 1. Update Auth Data (Email/Password)
      const authUpdates: any = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          authUpdates
        );
        if (authError) throw authError;
      }

      // 2. Update Profile Data (Full Name)
      if (full_name) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ full_name })
          .eq('id', userId);
        if (profileError) throw profileError;
      }

      res.json({ success: true, message: 'User updated successfully' });
    } catch (error: any) {
      console.error('Admin update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
