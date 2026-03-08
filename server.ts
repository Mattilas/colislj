import express from 'express';
import { createServer as createViteServer } from 'vite';
import webpush from 'web-push';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// VAPID keys
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BO-IT27AqBrgn3MMhY9u_yPtECACxN1MUzFIOyuFufLrX8J4qOY9muW1AglvE5dhuIU5YCRtu7L0MnUlhrabuAU';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'aE6JOIyug1_PsQ6ToeKKg8FMRb-2E3yazSNNmJIR6Bg';

webpush.setVapidDetails(
  'mailto:test@example.com',
  publicVapidKey,
  privateVapidKey
);

// Simple file-based storage for subscriptions
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');

const getSubscriptions = () => {
  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
};

const saveSubscriptions = (subs: any) => {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
};

// API Routes
app.get('/api/vapid-public-key', (req, res) => {
  res.send(publicVapidKey);
});

app.post('/api/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'userId and subscription are required' });
  }

  const subs = getSubscriptions();
  subs[userId] = subscription;
  saveSubscriptions(subs);

  res.status(201).json({ success: true });
});

app.post('/api/notify', async (req, res) => {
  const { userId, title, body, url } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: 'userId and title are required' });
  }

  const subs = getSubscriptions();
  const subscription = subs[userId];

  if (!subscription) {
    return res.status(404).json({ error: 'User not subscribed' });
  }

  const payload = JSON.stringify({
    title,
    body: body || '',
    url: url || '/'
  });

  try {
    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      delete subs[userId];
      saveSubscriptions(subs);
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
