import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bktwvgwokrnqvkpvemfv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHd2Z3dva3JucXZrcHZlbWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDA4NTIsImV4cCI6MjA4NzY3Njg1Mn0.iXy-25dVVTXBQvh-EEKBhlRlE4iExXE3LyGle0quk8E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
