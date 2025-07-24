import React, { useState, useEffect } from 'react';
import TextInputSection from './generate/TextInputSection';
import GeneratedFlashcardsList from './generate/GeneratedFlashcardsList';
import SaveActionsSection from './generate/SaveActionsSection';
import EditFlashcardModal from './generate/EditFlashcardModal';
import { useGenerateFlashcards } from './hooks/useGenerateFlashcards';
import { useAuth } from '../contexts/AuthContext';

const GenerateFlashcardsView: React.FC = () => {
  const { user, loading } = useAuth();
  const { 
    viewState, 
    editModal, 
    actions 
  } = useGenerateFlashcards();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }, [user, loading]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2">
          <div className="loading-spinner"></div>
          <span className="text-gray-600">Sprawdzanie autentykacji...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Text Input Section */}
      <TextInputSection
        value={viewState.sourceText}
        onChange={actions.updateSourceText}
        onGenerate={actions.generateFlashcards}
        isGenerating={viewState.isGenerating}
        errors={viewState.errors}
      />

      {/* Generated Flashcards List */}
      {viewState.flashcards.length > 0 && (
        <GeneratedFlashcardsList
          flashcards={viewState.flashcards}
          onFlashcardAction={actions.updateFlashcardStatus}
        />
      )}

      {/* Save Actions Section */}
      {viewState.flashcards.length > 0 && (
        <SaveActionsSection
          flashcards={viewState.flashcards}
          onSaveAll={actions.saveFlashcards}
          isSaving={viewState.isSaving}
        />
      )}

      {/* Edit Modal */}
      <EditFlashcardModal
        isOpen={editModal.isOpen}
        flashcard={editModal.currentFlashcard}
        onSave={actions.editFlashcard}
        onClose={actions.closeEditModal}
      />
    </div>
  );
};

export default GenerateFlashcardsView;
