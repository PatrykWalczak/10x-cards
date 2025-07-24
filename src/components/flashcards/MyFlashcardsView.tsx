import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../../db/supabase.client-side';
import type { FlashcardDto } from '../../types';
import FlashcardsList from './FlashcardsList';
import LoadingSpinner from './LoadingSpinner';

const MyFlashcardsView: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        setUser(session?.user || null);
        
        // Redirect to auth if not authenticated
        if (!session?.user) {
          window.location.href = '/auth';
          return;
        }

        // Load user's flashcards
        await loadFlashcards();
      } catch (error) {
        console.error('Error getting session:', error);
        window.location.href = '/auth';
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/auth';
      } else {
        setUser(session?.user || null);
        if (session?.user) {
          loadFlashcards();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadFlashcards = async () => {
    try {
      setError(null);
      const response = await fetch('/api/flashcards');
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać fiszek');
      }

      const data = await response.json();
      setFlashcards(data.data || []);
    } catch (error: any) {
      console.error('Error loading flashcards:', error);
      setError(error.message || 'Wystąpił błąd podczas ładowania fiszek');
    }
  };

  const handleUpdateFlashcard = async (id: number, updates: { front?: string; back?: string; source?: string }) => {
    try {
      const response = await fetch(`/api/flashcards?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować fiszki');
      }

      const data = await response.json();
      
      // Update local state
      setFlashcards(prev => 
        prev.map(card => card.id === id ? data.data : card)
      );

      return data.data;
    } catch (error: any) {
      console.error('Error updating flashcard:', error);
      throw error;
    }
  };

  const handleDeleteFlashcard = async (id: number) => {
    try {
      const response = await fetch(`/api/flashcards?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć fiszki');
      }

      // Remove from local state
      setFlashcards(prev => prev.filter(card => card.id !== id));
    } catch (error: any) {
      console.error('Error deleting flashcard:', error);
      throw error;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return <LoadingSpinner message="Ładowanie fiszek..." />;
  }

  // Don't render if no user (should redirect anyway)
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">❌ {error}</p>
          <button 
            onClick={loadFlashcards}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      <FlashcardsList
        flashcards={flashcards}
        onUpdate={handleUpdateFlashcard}
        onDelete={handleDeleteFlashcard}
        onReload={loadFlashcards}
      />
    </div>
  );
};

export default MyFlashcardsView;
