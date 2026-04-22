
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

  // API Route: Submit Transfer (Real Transaction)
  app.post('/api/transfer/submit', async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Supabase admin client not configured.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.split(' ')[1];
    const { data: { user: sender }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !sender) return res.status(401).json({ error: 'Invalid token' });

    const { details } = req.body;
    if (!details) return res.status(400).json({ error: 'Transfer details are required' });

    try {
      const amount = parseFloat(details.eurAmount?.toString() || details.amount?.toString() || '0');
      const senderAccountId = details.accountId;

      if (amount <= 0) {
        return res.status(400).json({ error: 'Invalid transfer amount.' });
      }

      // 1. Verify Sender Balance
      let senderBalance: number;
      if (senderAccountId) {
        const { data: account, error: accError } = await supabaseAdmin
          .from('user_accounts')
          .select('balance')
          .eq('id', senderAccountId)
          .eq('user_id', sender.id)
          .single();
        if (accError) throw new Error(`Sender account error: ${accError.message}`);
        senderBalance = account.balance;
      } else {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', sender.id)
          .single();
        if (profileError) throw new Error(`Sender profile error: ${profileError.message}`);
        senderBalance = profile.balance;
      }

      if (senderBalance < amount) {
        return res.status(400).json({ error: 'Insufficient Liquidity' });
      }

      // 2. Real-World Gateway Processing (If RAAST)
      if (details.isRaast) {
        console.log(`[RAAST GATEWAY] Initiating settlement for Reference: ${details.referenceId}`);
        // Simulate external bank API handshake (e.g., Bank Alfalah / Alfa App)
        if (details.gatewayBank?.toLowerCase().includes('alfalah')) {
          console.log(`[RAAST GATEWAY] Handshaking with Bank Alfalah (Alfa) API...`);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        details.utr = `RAAST${Math.random().toString().slice(2, 14).toUpperCase()}`;
      }

      // 3. Deduct from Sender
      const newSenderBalance = senderBalance - amount;
      if (senderAccountId) {
        const { error: updAccErr } = await supabaseAdmin.from('user_accounts').update({ balance: newSenderBalance }).eq('id', senderAccountId);
        if (updAccErr) throw updAccErr;
        
        const { data: profile, error: profGetErr } = await supabaseAdmin.from('profiles').select('balance').eq('id', sender.id).single();
        if (profGetErr) throw profGetErr;
        
        const { error: updProfErr } = await supabaseAdmin.from('profiles').update({ balance: profile.balance - amount }).eq('id', sender.id);
        if (updProfErr) throw updProfErr;
      } else {
        const { error: updProfErr } = await supabaseAdmin.from('profiles').update({ balance: newSenderBalance }).eq('id', sender.id);
        if (updProfErr) throw updProfErr;
        
        const { error: updAccErr } = await supabaseAdmin.from('user_accounts').update({ balance: newSenderBalance }).eq('user_id', sender.id).eq('is_primary', true);
        if (updAccErr) throw updAccErr;
      }

      // 4. Record Sender Transaction
      const { data: txData, error: txError } = await supabaseAdmin
        .from('transactions')
        .insert([{
          user_id: sender.id,
          account_id: senderAccountId,
          name: details.name,
          recipient_name: details.recipientName,
          amount: details.amount,
          currency: details.currency,
          type: 'out',
          status: 'Settled',
          reference_id: details.referenceId || `TX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          recipient_iban: details.recipient,
          bic: details.bic,
          payment_reason: details.paymentReason,
          is_sepa: details.isSepa,
          is_hsbc_global: details.isHsbcGlobal,
          is_direct_debit: details.isDirectDebit,
          is_raast: details.isRaast,
          raast_id: details.raastId,
          mandate_reference: details.mandateReference,
          gateway_bank: details.gatewayBank,
          gateway_url: details.gatewayUrl,
          timeframe: details.timeframe,
          utr: details.utr,
          fee: details.fee,
          total_settlement: details.totalSettlement
        }])
        .select()
        .single();

      if (txError) {
        console.error('Transaction Record Error:', txError);
        throw new Error(`Transaction Record Error: ${txError.message} (Hint: ${txError.hint || 'None'})`);
      }

      // 5. Check for Internal Recipient
      const recipientIban = details.recipient?.replace(/\s/g, '').toUpperCase();
      const rawRaastId = details.raastId?.replace(/\D/g, ''); // Remove non-digits
      
      // Normalize Raast ID for lookup (handle +92, 92, 0, etc.)
      const normalizedRaastId = rawRaastId ? (rawRaastId.startsWith('92') ? rawRaastId.slice(2) : rawRaastId.startsWith('0') ? rawRaastId.slice(1) : rawRaastId) : null;

      let recipientId = null;
      let recipientAccId = null;

      if (normalizedRaastId) {
        console.log(`[INTERNAL LOOKUP] Searching for RAAST ID: ${normalizedRaastId}`);
        // Search in profiles (using ILIKE or similar to handle potential formatting in DB)
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').or(`raast_id.ilike.%${normalizedRaastId}`).single();
        if (profile) {
          recipientId = profile.id;
        } else {
          const { data: acc } = await supabaseAdmin.from('user_accounts').select('id, user_id').or(`raast_id.ilike.%${normalizedRaastId}`).single();
          if (acc) {
            recipientId = acc.user_id;
            recipientAccId = acc.id;
          }
        }
      } else if (recipientIban) {
        console.log(`[INTERNAL LOOKUP] Searching for IBAN: ${recipientIban}`);
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('iban', recipientIban).single();
        if (profile) recipientId = profile.id;
        else {
          const { data: acc } = await supabaseAdmin.from('user_accounts').select('id, user_id').eq('iban', recipientIban).single();
          if (acc) {
            recipientId = acc.user_id;
            recipientAccId = acc.id;
          }
        }
      }

      if (recipientId) {
        console.log(`[INTERNAL CREDIT] Recipient found: ${recipientId}. Crediting ${amount} EUR.`);
        const recipientAmount = amount;
        
        // Use a more robust update pattern
        if (recipientAccId) {
          const { data: acc } = await supabaseAdmin.from('user_accounts').select('balance').eq('id', recipientAccId).single();
          if (acc) {
            const newAccBalance = Number(acc.balance) + recipientAmount;
            await supabaseAdmin.from('user_accounts').update({ balance: newAccBalance }).eq('id', recipientAccId);
            
            const { data: prof } = await supabaseAdmin.from('profiles').select('balance').eq('id', recipientId).single();
            if (prof) {
              const newProfBalance = Number(prof.balance) + recipientAmount;
              await supabaseAdmin.from('profiles').update({ balance: newProfBalance }).eq('id', recipientId);
            }
          }
        } else {
          const { data: prof } = await supabaseAdmin.from('profiles').select('balance, full_name').eq('id', recipientId).single();
          if (prof) {
            const newProfBalance = Number(prof.balance) + recipientAmount;
            await supabaseAdmin.from('profiles').update({ balance: newProfBalance }).eq('id', recipientId);
            // Also update the primary account balance to keep it in sync
            await supabaseAdmin.from('user_accounts').update({ balance: newProfBalance }).eq('user_id', recipientId).eq('is_primary', true);
          }
        }

        const { data: recipientProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', recipientId).single();
        if (recipientProfile) {
          const { error: inTxErr } = await supabaseAdmin.from('transactions').insert([{
            user_id: recipientId,
            account_id: recipientAccId,
            name: `Incoming RAAST Transfer from ${details.name || 'External Bank'}`,
            recipient_name: recipientProfile.full_name,
            amount: details.amount,
            currency: details.currency,
            type: 'in',
            status: 'Settled',
            reference_id: `IN-${txData.reference_id}-${Date.now()}`,
            recipient_iban: recipientIban,
            raast_id: details.raastId,
            bic: details.bic,
            payment_reason: details.paymentReason,
            is_raast: details.isRaast,
            utr: details.utr
          }]);
          if (inTxErr) console.error('Error creating incoming transaction record:', inTxErr);
        }
      } else {
        console.log(`[EXTERNAL SETTLEMENT] No internal recipient found for ${details.raastId || details.recipient}. Proceeding with external clearing.`);
      }

      res.json({ 
        success: true, 
        newBalance: newSenderBalance,
        transaction: txData 
      });
    } catch (error: any) {
      console.error('Transfer error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.message || 'An unexpected error occurred during transfer.' });
    }
  });

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
