import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bktwvgwokrnqvkpvemfv.supabase.co';
// TEMP: usar service role key até obter a anon key correcta do dashboard
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHd2Z3dva3JucXZrcHZlbWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEwMDg1MiwiZXhwIjoyMDg3Njc2ODUyfQ.MuHRnltWykkyshiZ4nIiG9UXb0oIIvKLquAyjpxWSTg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
