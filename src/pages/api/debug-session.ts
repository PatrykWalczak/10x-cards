import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const supabase = locals.supabase;

  // Get all cookies from Astro cookies object
  const allCookies: Record<string, string> = {};
  try {
    // Try to get cookies if they exist
    const cookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];
    cookieNames.forEach((name) => {
      const value = cookies.get(name)?.value;
      if (value) {
        allCookies[name] = value.substring(0, 20) + "..."; // Truncate for security
      }
    });
  } catch {
    // Ignore errors getting cookies
  }

  // Get cookie header directly
  const cookieHeader = request.headers.get("cookie") || "";

  // Get session
  let session = null;
  let sessionError = null;
  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;
    sessionError = result.error;
  } catch (error) {
    sessionError = error;
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    hasSupabaseClient: !!supabase,
    cookieHeader: cookieHeader ? cookieHeader.substring(0, 100) + "..." : "No cookie header",
    astroPickedCookies: allCookies,
    session: {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at,
    },
    sessionError: sessionError?.message,
    relevantHeaders: {
      cookie: request.headers.get("cookie") ? "Present" : "Missing",
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    },
  };

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
