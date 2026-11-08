import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

// Semua app ada di cassieorcasey.github.io, jadi sesi login ikut terbagi:
// sudah masuk di Synthesis atau Waypoint berarti sudah masuk di sini juga.
export const sb: SupabaseClient | null = DEMO
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
