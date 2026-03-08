import express from 'express';
import { createServer as createViteServer } from 'vite';
import webpush from 'web-push';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// VAPID keys
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BO-IT27AqBrgn3MMhY9u_yPtECACxN1MUzFIOyuFufLrX8J4qOY9muW1AglvE5dhuIU5YCRtu7L0MnUlhrabuAU';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'aE6JOIyug1_PsQ6ToeKKg8FMRb-2E3yazSNNmJIR6Bg';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
  'mailto:test@example.com',
  publicVapidKey,
  privateVapidKey
);

// API Routes
app.get('/api/vapid-public-key', (req, res) => {
  res.send(publicVapidKey);
});

app.post('/api/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'userId and subscription are required' });
  }

  try {
    // Delete old subscription for this user
    await supabase
      .from('messages')
      .delete()
      .eq('fromUserId', 'SYSTEM_SUBSCRIPTION')
      .eq('toUserId', userId);
    
    // Insert new subscription
    const { error } = await supabase.from('messages').insert({
      id: `sub_${userId}_${Date.now()}`,
      fromUserId: 'SYSTEM_SUBSCRIPTION',
      toUserId: userId,
      content: JSON.stringify(subscription),
      timestamp: Date.now(),
      isRead: true
    });
    
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

app.post('/api/notify', async (req, res) => {
  const { userId, title, body, url } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: 'userId and title are required' });
  }

  try {
    // Get subscription from messages table
    const { data, error } = await supabase
      .from('messages')
      .select('content')
      .eq('fromUserId', 'SYSTEM_SUBSCRIPTION')
      .eq('toUserId', userId)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'User not subscribed' });
    }

    const subscription = JSON.parse(data[0].content);

    const payload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/'
    });

    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      await supabase
        .from('messages')
        .delete()
        .eq('fromUserId', 'SYSTEM_SUBSCRIPTION')
        .eq('toUserId', userId);
    }
    
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
