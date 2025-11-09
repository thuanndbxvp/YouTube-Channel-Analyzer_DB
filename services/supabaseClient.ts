import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rsranmabasedagseebph.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcmFubWFiYXNlZGFnc2VlYnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODk2NjYsImV4cCI6MjA3ODI2NTY2Nn0.q4SeRWkIKPzUpyuV9rZiGBrHVLcv112I1SgmGiNQOeQ';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
