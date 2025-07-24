import React, { useState, useEffect } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { Toaster } from '../ui/toast';
import { supabaseClient } from '../../db/supabase.client-side';

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'reset' | 'new-password';
}

export const AuthPage = ({ initialMode = 'login' }: AuthPageProps) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'new-password'>(initialMode);
  useEffect(() => {
    // Get mode from URL params on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get('mode');
      const fullUrl = window.location.href;
      const hash = window.location.hash;
        // Debug: Show what we're getting
      console.log('AuthPage Debug:', {
        fullUrl,
        urlMode,
        hash,
        search: window.location.search,
        pathname: window.location.pathname,
        allSearchParams: Object.fromEntries(urlParams.entries())
      });
        // Handle different mode formats
      if (urlMode === 'reset-password' || urlMode === 'reset') {
        // Check if this is a password reset with recovery token
        // Look for recovery tokens in both hash and search params
        const hasRecoveryToken = hash.includes('type=recovery') || 
                                hash.includes('access_token') ||
                                urlParams.has('token_hash') ||
                                urlParams.has('type') ||
                                urlParams.has('access_token') ||
                                urlParams.has('refresh_token') ||
                                fullUrl.includes('recovery') ||
                                fullUrl.includes('access_token') ||
                                fullUrl.includes('token_hash');
        
        console.log('Reset password check:', {
          hasRecoveryToken,
          hashIncludes: {
            recovery: hash.includes('type=recovery'),
            accessToken: hash.includes('access_token')
          },
          searchParams: {
            tokenHash: urlParams.has('token_hash'),
            type: urlParams.has('type'),
            typeValue: urlParams.get('type'),
            accessToken: urlParams.has('access_token'),
            refreshToken: urlParams.has('refresh_token')
          },
          fullUrlIncludes: {
            recovery: fullUrl.includes('recovery'),
            accessToken: fullUrl.includes('access_token'),
            tokenHash: fullUrl.includes('token_hash')
          }
        });
        
        if (hasRecoveryToken) {
          console.log('Setting mode to new-password');
          setMode('new-password');
        } else {
          console.log('Setting mode to reset');
          setMode('reset');
        }      } else if (urlMode && ['login', 'register'].includes(urlMode)) {
        setMode(urlMode as 'login' | 'register' | 'reset' | 'new-password');
      }
        // Listen for auth state changes to detect recovery session
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', { event, session: !!session });
          
          if (event === 'PASSWORD_RECOVERY' && session) {
            console.log('Password recovery detected, switching to new-password mode');
            setMode('new-password');
          }
        }
      );
        // Also check current session state on load
      const checkCurrentSession = async () => {
        try {
          const { data: { session }, error } = await supabaseClient.auth.getSession();
          console.log('Current session check:', { 
            session: !!session, 
            error: error?.message,
            userRecoveryActive: session?.user?.recovery_sent_at
          });
          
          // If we have a session during password recovery flow
          if (session && (urlMode === 'reset-password' || urlMode === 'reset')) {
            console.log('Found active session during recovery flow, switching to new-password mode');
            setMode('new-password');
          }
        } catch (error) {
          console.error('Error checking session:', error);
        }
      };
        // Try to handle session from URL manually if detectSessionInUrl didn't work
      const handleSessionFromUrl = async () => {
        try {
          // Check if URL contains session tokens and try to exchange them
          if (hash.includes('access_token') || urlParams.has('access_token')) {
            console.log('Found access token in URL, waiting for Supabase to process...');
            // Give Supabase time to process the session from URL
            setTimeout(async () => {
              const { data: { session } } = await supabaseClient.auth.getSession();
              if (session) {
                console.log('Session established from URL tokens, switching to new-password mode');
                setMode('new-password');
              }
            }, 1000);
          }
        } catch (error) {
          console.log('Error handling session from URL:', error);
        }
      };
      
      checkCurrentSession();
      handleSessionFromUrl();
      
      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleModeChange = (newMode: 'login' | 'register' | 'reset' | 'new-password') => {
    setMode(newMode);
    
    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newMode === 'login') {
        url.searchParams.delete('mode');
      } else {
        url.searchParams.set('mode', newMode);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <AuthProvider>
      <div className="w-full max-w-md mx-auto">
        <AuthForm mode={mode} onModeChange={handleModeChange} />
        <Toaster />
      </div>
    </AuthProvider>
  );
};
