import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      SUPABASE_URL: import.meta.env.SUPABASE_URL ? 'Present' : 'Missing',
      SUPABASE_KEY: import.meta.env.SUPABASE_KEY ? 'Present' : 'Missing',
      OPENROUTER_API_KEY: import.meta.env.OPENROUTER_API_KEY ? 'Present' : 'Missing',
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    },
    openrouterKeyLength: import.meta.env.OPENROUTER_API_KEY?.length || 0,
    openrouterKeyStart: import.meta.env.OPENROUTER_API_KEY?.substring(0, 8) || 'N/A'
  };
  
  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
