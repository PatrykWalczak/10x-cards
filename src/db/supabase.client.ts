import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side client with proper SSR cookies support
export function createSupabaseServerClient({ cookies, headers }: { cookies: any, headers: any }) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Astro cookies doesn't have getAll(), so we need to parse from headers
        const cookieHeader = headers.get('cookie') || '';
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            ...options,
            httpOnly: false, // Important: allow client-side access
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        });
      },
    },
  });
}

// Helper function to parse cookie header into the format expected by Supabase
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export type SupabaseClient = typeof supabaseClient;
export type DEFAULT_USER_ID = "3494a148-0de7-45d4-a722-a16385acac62"
