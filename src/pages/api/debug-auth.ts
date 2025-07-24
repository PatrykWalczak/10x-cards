import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const supabase = locals.supabase;
  const url = new URL(request.url);
  
  // Parse URL for tokens
  const urlParams = new URLSearchParams(url.search);
  const hash = url.hash;
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    url: request.url,
    searchParams: Object.fromEntries(urlParams.entries()),
    hash,
    hasTokens: {
      accessToken: urlParams.has('access_token') || hash.includes('access_token'),
      refreshToken: urlParams.has('refresh_token') || hash.includes('refresh_token'),
      tokenHash: urlParams.has('token_hash') || hash.includes('token_hash'),
      type: urlParams.has('type') || hash.includes('type'),
      recovery: hash.includes('recovery') || urlParams.get('type') === 'recovery'
    },
    supabaseSession: null,
    supabaseError: null
  };
  
  // Check current session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    debugInfo.supabaseSession = {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at,
    };
    debugInfo.supabaseError = error?.message;
  } catch (error) {
    debugInfo.supabaseError = error?.message || 'Unknown error';
  }
  
  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
