import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BO-IT27AqBrgn3MMhY9u_yPtECACxN1MUzFIOyuFufLrX8J4qOY9muW1AglvE5dhuIU5YCRtu7L0MnUlhrabuAU';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'aE6JOIyug1_PsQ6ToeKKg8FMRb-2E3yazSNNmJIR6Bg';

webpush.setVapidDetails(
  'mailto:test@example.com',
  publicVapidKey,
  privateVapidKey
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, title, body, url } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: 'userId and title are required' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('messages')
        .delete()
        .eq('fromUserId', 'SYSTEM_SUBSCRIPTION')
        .eq('toUserId', userId);
    }
    
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
