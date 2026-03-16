import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "ecocolis-9214f",
      clientEmail: "firebase-adminsdk-fbsvc@ecocolis-9214f.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfcBxqxMAmcZq3\nLETG7qHrINjvSFEAM470zOW3TrDwO8BcuvTk/ppeTnCZgIkLrJDTpomHTZ4Ro5Z8\n4VdwIeerw4bhFerZ+IG83WhDlj1c7suoNa4Z1X8YMRZNfknqLstYwSY5fBhviHm7\nCJ4ROCJN2dvhfL16JZMMo4dGCezt+f/PzADMkhvNu136w5wDJP239desNM9B+f2Q\n3dDr96W/WvmSnvTw478S1O3BslcPUpFLVzB5h1DO9vxAgX5CFX7FgzgCnZmisv0Q\n2MNUWRnaeeQhvisz3jZWZEKvKwUTTF5X5cSZIk9HF2KvgaMeV6oe60QT+d5b02yy\nxWQWiWujAgMBAAECggEAYu+GdbRXDO7CvhbpAVkK800hIZrY2wj5ZOYRVYCPkmAy\nxhy2cWtXOSjsbNvgUv3/Ruh3/yRcOJ1B9lvlVq58oa67W5FT415JPDKhh0PQOgU2\nwm26gI/rbe/WW0vvOLWtrsgfv9Z2D3TTygB/1UoQzn4IAak1UQ+wNCl4rYeZlKmJ\nJR7gCcp6fSBMz3KHgzD94nr/Bp/POaiDAjjvsT8Bibwm6UmtidfnzPCgERvDvp1h\nD/TKB85JNVvW+I3yB/c/4GUUrx7EarPjffWsUiOC140/vJK9oCHg4RzbgrafwlDs\nedwHgu1/185T7kUDzRFgVnFqM79pM47kwdOwU9h0yQKBgQD5D+R32ECSLhzgFPk7\nrkL/WNKwouPPHHwhBvP5bthszC4zQp0co8s+12+sER+NDwGf2mUIavWcNk5uO2g/\nS1GyYu6M9OqnRuCRbAxhjvyhHFUlqnXsGqQugQh4zAt8P00SRrWCOLuRhvlghRyl\ng6mPKwh2EbRvbn8smvyQILcJ5wKBgQDlqXzwj4QXyBYrQdWST0AByBCfSi9CLG2L\nSI2cSva9uGpjp4XtMgbH8iKv66nQthaiQzTHZCEKwxUB1EDFdAFrityJ6sK7pof4\ntu8+Q8v8/6vNplwn0aRgm3sixUujrGPgWtQYN7BIJO5qyXYB3UrAIj8p0OPh2VjM\ntMX+q7Pw5QKBgDQeIT7637g3Mg+qE+VrN9XbLmuMCoPCgC8hF1iw21UY/On5HItr\nsxI5XsLw6ltIMpzSxKWYTEEeFBd5Ev17s2LS1PxmG9xZNpD3vTeFBlRoa2DwZLC9\nenHIyo8Mk7KyRFx4s27GlGmFhxWthSsVfBvbc2/RkKJoyu/4lrVKQ0MtAoGBAM0w\nHZFsF++Lc8sYGbGLnrs4vSkkBY8Q1Jphqyvdig+9SUhZ7v0Z+hcADd+xJNp1JUm5\n09jla+QKoaUttuTzHSWxPhL2rR8szUT4ZE30Ereq0ht9q85jroIlx+Er9sV4Cw/y\n9pXgg14hqOW9svI9fUCmGFrK6B7rqjvSsycyzyTFAoGBAOgB7Fp7EY80QEZkPUI1\nJeKUEaD8CAv7egPAft4TlLyslFOjznNxIUARq+hwA3aVIzYX6MTnKBFWI3sYArRk\nWEDylhiRf4NJy2Mn2VvL0d2lHYEw9+1rMrnlKDVtboSH4vZTXnhlyTGUX7ATQYfv\n4fiGW/ZF1+oD71kT4zeYpA7L\n-----END PRIVATE KEY-----\n"
    }),
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// API Routes
app.post('/api/subscribe', async (req, res) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token are required' });
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
      content: token, // Store the FCM token directly as a string
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

    const token = data[0].content; // FCM token is stored directly as a string

    const message = {
      notification: {
        title,
        body: body || '',
      },
      data: {
        url: url || '/'
      },
      token: token,
    };

    await admin.messaging().send(message);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    
    // If the token is invalid or unregistered, remove it from the database
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
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
