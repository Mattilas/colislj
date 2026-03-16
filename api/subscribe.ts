import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token are required' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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
}
