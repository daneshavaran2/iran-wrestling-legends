// Supabase client with fallback values for deployment on other servers
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Fallback values for when environment variables are not set
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://etbekvhdroqiddcteqdq.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YmVrdmhkcm9xaWRkY3RlcWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjU4MTUsImV4cCI6MjA4Mjk0MTgxNX0.cDiwofOdALtJ349janVwJtuItIRwvY3DC8ihO0rmlPU';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export URL for edge functions if needed
export const supabaseUrl = SUPABASE_URL;
