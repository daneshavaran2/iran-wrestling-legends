// Supabase client with fallback values for deployment on other servers
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Fallback values for when environment variables are not set
const FALLBACK_URL = 'https://etbekvhdroqiddcteqdq.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YmVrdmhkcm9xaWRkY3RlcWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjU4MTUsImV4cCI6MjA4Mjk0MTgxNX0.cDiwofOdALtJ349janVwJtuItIRwvY3DC8ihO0rmlPU';

// Get environment variables with fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;

// Debug logging for troubleshooting connection issues
if (import.meta.env.DEV) {
  console.log('Supabase Config:', {
    url: SUPABASE_URL,
    usingFallback: !import.meta.env.VITE_SUPABASE_URL,
  });
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'wrestling-museum-app',
    },
  },
});

// Export URL for edge functions if needed
export const supabaseUrl = SUPABASE_URL;

// Test connection function with timeout
export const testConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const { error } = await supabase
      .from('wrestlers')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeout);
    return !error;
  } catch {
    return false;
  }
};

// Fetch with retry and exponential backoff
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (i < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 500;
        console.log(`[Supabase] Retry ${i + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Health check endpoint
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
}> {
  const start = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const { error } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeout);
    const latency = Date.now() - start;
    
    if (error) {
      return { status: 'degraded', latency };
    }
    
    return {
      status: latency < 2000 ? 'healthy' : 'degraded',
      latency
    };
  } catch {
    return { status: 'offline', latency: 0 };
  }
}
