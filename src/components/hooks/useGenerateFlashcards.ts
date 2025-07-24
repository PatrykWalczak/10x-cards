import { useState, useCallback } from 'react';
import type { 
  GenerateViewState, 
  EditModalState, 
  FlashcardViewState,
  FlashcardAction,
  EditFlashcardData,
  GenerateFlashcardsRequestDto,
  GenerateFlashcardsResponseDto,
  CreateFlashcardsRequestDto,
  CreateFlashcardsResponseDto
} from '../../types';

export const useGenerateFlashcards = () => {
  const [viewState, setViewState] = useState<GenerateViewState>({
    sourceText: '',
    isGenerating: false,
    isSaving: false,
    flashcards: [],
    errors: [],
    generationId: null,
  });

  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    currentFlashcard: null,
  });

  // Walidacja długości tekstu
  const validateSourceText = (text: string): string[] => {
    const errors: string[] = [];
    if (text.length < 1000) {
      errors.push('Tekst musi mieć co najmniej 1000 znaków');
    }
    if (text.length > 10000) {
      errors.push('Tekst nie może przekraczać 10000 znaków');
    }
    return errors;
  };

  // Aktualizacja tekstu źródłowego
  const updateSourceText = useCallback((text: string) => {
    const errors = validateSourceText(text);
    setViewState(prev => ({
      ...prev,
      sourceText: text,
      errors,
    }));
  }, []);

  // Generowanie fiszek
  const generateFlashcards = useCallback(async () => {
    const errors = validateSourceText(viewState.sourceText);
    if (errors.length > 0) {
      setViewState(prev => ({ ...prev, errors }));
      return;
    }

    setViewState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      errors: [],
      flashcards: [] 
    }));

    try {
      const requestData: GenerateFlashcardsRequestDto = {
        source_text: viewState.sourceText,
      };      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Nie udało się wygenerować fiszek');
      }

      const data: GenerateFlashcardsResponseDto = await response.json();

      const flashcardsWithState: FlashcardViewState[] = data.flashcards.map(flashcard => ({
        ...flashcard,
        status: 'pending' as const,
        isEdited: false,
      }));

      setViewState(prev => ({
        ...prev,
        flashcards: flashcardsWithState,
        generationId: data.generation_id,
        isGenerating: false,
      }));
    } catch (error) {
      setViewState(prev => ({
        ...prev,
        isGenerating: false,
        errors: [error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd'],
      }));
    }
  }, [viewState.sourceText]);

  // Aktualizacja statusu fiszki
  const updateFlashcardStatus = useCallback((id: number, action: FlashcardAction) => {
    if (action === 'edit') {
      const flashcard = viewState.flashcards.find(f => f.id === id);
      if (flashcard) {
        setEditModal({
          isOpen: true,
          currentFlashcard: flashcard,
        });
      }
      return;
    }

    setViewState(prev => ({
      ...prev,
      flashcards: prev.flashcards.map(flashcard => {
        if (flashcard.id === id) {
          return {
            ...flashcard,
            status: action === 'accept' ? 'accepted' : 'rejected',
          };
        }
        return flashcard;
      }),
    }));
  }, [viewState.flashcards]);

  // Edycja fiszki
  const editFlashcard = useCallback((data: EditFlashcardData) => {
    if (!editModal.currentFlashcard) return;

    const flashcardId = editModal.currentFlashcard.id;
    
    setViewState(prev => ({
      ...prev,
      flashcards: prev.flashcards.map(flashcard => {
        if (flashcard.id === flashcardId) {
          return {
            ...flashcard,
            status: 'edited' as const,
            isEdited: true,
            editedFront: data.front,
            editedBack: data.back,
          };
        }
        return flashcard;
      }),
    }));

    setEditModal({
      isOpen: false,
      currentFlashcard: null,
    });
  }, [editModal.currentFlashcard]);

  // Zamknięcie modala edycji
  const closeEditModal = useCallback(() => {
    setEditModal({
      isOpen: false,
      currentFlashcard: null,
    });
  }, []);

  // Zapisywanie fiszek
  const saveFlashcards = useCallback(async () => {
    const flashcardsToSave = viewState.flashcards.filter(
      f => f.status === 'accepted' || f.status === 'edited'
    );

    if (flashcardsToSave.length === 0) return;

    setViewState(prev => ({ ...prev, isSaving: true }));

    try {
      const requestData: CreateFlashcardsRequestDto = {
        flashcards: flashcardsToSave.map(flashcard => ({
          front: flashcard.isEdited ? flashcard.editedFront! : flashcard.front,
          back: flashcard.isEdited ? flashcard.editedBack! : flashcard.back,
          source: flashcard.isEdited ? 'ai-edited' : 'ai-full',
          generation_id: viewState.generationId,
        })),
      };      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Nie udało się zapisać fiszek');
      }

      const data: CreateFlashcardsResponseDto = await response.json();

      // Reset widoku po udanym zapisie
      setViewState({
        sourceText: '',
        isGenerating: false,
        isSaving: false,
        flashcards: [],
        errors: [],
        generationId: null,
      });

      // TODO: Dodać toast notification o sukcesie
      alert(`Zapisano ${data.count} fiszek!`);
    } catch (error) {
      setViewState(prev => ({
        ...prev,
        isSaving: false,
        errors: [error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd'],
      }));
    }
  }, [viewState.flashcards, viewState.generationId]);

  // Reset widoku
  const resetView = useCallback(() => {
    setViewState({
      sourceText: '',
      isGenerating: false,
      isSaving: false,
      flashcards: [],
      errors: [],
      generationId: null,
    });
    setEditModal({
      isOpen: false,
      currentFlashcard: null,
    });
  }, []);

  return {
    viewState,
    editModal,
    actions: {
      updateSourceText,
      generateFlashcards,
      updateFlashcardStatus,
      editFlashcard,
      closeEditModal,
      saveFlashcards,
      resetView,
    },
  };
};
