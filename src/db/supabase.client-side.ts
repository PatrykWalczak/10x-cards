import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_KEY in .env file');
}

// Use regular createClient but with custom storage that synchronizes with cookies
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          // Try localStorage first, then cookies
          const localValue = window.localStorage.getItem(key);
          if (localValue) return localValue;
          
          // Fallback to cookies
          const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(key + '='))
            ?.split('=')[1];
          return cookieValue || null;
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          // Set in localStorage
          window.localStorage.setItem(key, value);
          
          // Also set as cookie for server-side access (non-httpOnly)
          const maxAge = 60 * 60 * 24 * 7; // 7 days
          document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          // Remove from localStorage
          window.localStorage.removeItem(key);
          
          // Remove cookie
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      },
    },
  },
});

export default supabaseClient;
