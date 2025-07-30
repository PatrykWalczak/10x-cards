import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals, cookies, request } = context;

  const pathname = url.pathname;

  // Create Supabase client for all requests (including API routes)
  locals.supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  // For API routes, ensure we have the Supabase client available
  if (pathname.startsWith("/api/")) {
    return next();
  }

  // Skip auth checks for static assets only
  if (pathname.startsWith("/_") || pathname.includes(".")) {
    return next();
  }

  // Define protected and public routes
  const protectedRoutes = ["/generate", "/flashcards", "/study", "/profile"];
  const authRoutes = ["/auth"];

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Check if current route is auth-related
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // For now, let's disable the auth redirects to prevent the loop
  // We'll handle authentication on the client side
  if (isProtectedRoute) {
    // Let the page handle authentication check
    return next();
  }

  if (isAuthRoute) {
    // Let the auth page handle authentication state
    return next();
  }

  // For homepage, always allow through for now
  return next();
});
