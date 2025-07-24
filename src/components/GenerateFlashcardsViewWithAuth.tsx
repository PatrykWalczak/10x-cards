import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../db/supabase.client-side';
import TextInputSection from './generate/TextInputSection';
import GeneratedFlashcardsList from './generate/GeneratedFlashcardsList';
import SaveActionsSection from './generate/SaveActionsSection';
import EditFlashcardModal from './generate/EditFlashcardModal';
import { useGenerateFlashcards } from './hooks/useGenerateFlashcards';

const GenerateFlashcardsViewWithAuth: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    viewState, 
    editModal, 
    actions 
  } = useGenerateFlashcards();

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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Sprawdzanie autentykacji...</span>
        </div>
      </div>
    );
  }

  // Don't render if no user (should redirect anyway)
  if (!user) {
    return null;
  }
  const {
    sourceText,
    flashcards,
    isGenerating,
    isSaving,
    errors
  } = viewState;
  return (
    <div className="space-y-8">
      {/* Step 1: Text Input */}
      <div className="relative">
        <div className="absolute -left-4 top-8 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          1
        </div>
        <TextInputSection
          value={sourceText}
          onChange={actions.updateSourceText}
          onGenerate={actions.generateFlashcards}
          isGenerating={isGenerating}
          errors={errors}
        />
      </div>

      {flashcards.length > 0 && (
        <>
          {/* Step 2: Review Flashcards */}
          <div className="relative">
            <div className="absolute -left-4 top-8 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <GeneratedFlashcardsList
              flashcards={flashcards}
              onFlashcardAction={actions.updateFlashcardStatus}
            />
          </div>

          {/* Step 3: Save Flashcards */}
          <div className="relative">
            <div className="absolute -left-4 top-8 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <SaveActionsSection
              flashcards={flashcards}
              onSaveAll={actions.saveFlashcards}
              isSaving={isSaving}
            />
          </div>
        </>
      )}      {editModal.isOpen && editModal.currentFlashcard && (
        <EditFlashcardModal
          isOpen={editModal.isOpen}
          flashcard={editModal.currentFlashcard}
          onSave={actions.editFlashcard}
          onClose={actions.closeEditModal}
        />
      )}
    </div>
  );
};

export default GenerateFlashcardsViewWithAuth;
