
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We use a dummy URL if missing to prevent initialization crash.
// Supabase requires a valid URL format even for placeholders.
const placeholderUrl = 'https://placeholder-project.supabase.co';
const placeholderKey = 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "EcoColis: Les variables d'environnement Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) sont manquantes. " +
    "L'application ne pourra pas sauvegarder les données sans ces clés configurées dans Vercel ou votre fichier .env."
  );
}

// createClient throws if url is empty, so we provide a placeholder to prevent the app from crashing on boot.
export const supabase = createClient(
  supabaseUrl || placeholderUrl, 
  supabaseAnonKey || placeholderKey
);
