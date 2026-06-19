import { createClient } from '@supabase/supabase-js';

// ── Supabase KANDU ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://bktwvgwokrnqvkpvemfv.supabase.co';

// Anon key válida até 2030 — não alterar sem actualizar no Supabase dashboard
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHd2Z3dva3JucXZrcHZlbWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDA4NTIsImV4cCI6MjA4NzY3Njg1Mn0.iXy-25dVVTXBQvh-EEKBhlRlE4iExXE3LyGle0quk8E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
