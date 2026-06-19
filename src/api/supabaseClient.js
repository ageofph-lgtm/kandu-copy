import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bktwvgwokrnqvkpvemfv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHd2Z3dva3JucXZrcHZlbWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDA3MjUsImV4cCI6MjA2NTIxNjcyNX0.yUxCMbSv5HkUlLNUMObWNAqtpOdpVnImpHVo6WNJf6A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
