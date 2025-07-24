import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EditFlashcardModalProps, EditFlashcardData } from '../../types';

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  flashcard,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<EditFlashcardData>({
    front: '',
    back: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when flashcard changes
  useEffect(() => {
    if (flashcard) {
      const initialData = {
        front: flashcard.isEdited ? flashcard.editedFront! : flashcard.front,
        back: flashcard.isEdited ? flashcard.editedBack! : flashcard.back
      };
      setFormData(initialData);
      setHasChanges(false);
      setErrors({});
    }
  }, [flashcard]);

  // Check for changes
  useEffect(() => {
    if (flashcard) {
      const originalFront = flashcard.isEdited ? flashcard.editedFront! : flashcard.front;
      const originalBack = flashcard.isEdited ? flashcard.editedBack! : flashcard.back;
      
      setHasChanges(
        formData.front !== originalFront || formData.back !== originalBack
      );
    }
  }, [formData, flashcard]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.front.trim()) {
      newErrors.front = 'Pole "Przód" jest wymagane';
    } else if (formData.front.length > 200) {
      newErrors.front = 'Przód nie może przekraczać 200 znaków';
    }

    if (!formData.back.trim()) {
      newErrors.back = 'Pole "Tył" jest wymagane';
    } else if (formData.back.length > 500) {
      newErrors.back = 'Tył nie może przekraczać 500 znaków';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (!hasChanges) {
      onClose();
      return;
    }

    onSave({
      front: formData.front.trim(),
      back: formData.back.trim()
    });
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'Masz niezapisane zmiany. Czy na pewno chcesz zamknąć okno?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (!flashcard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę #{flashcard.id}</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w treści fiszki. Ctrl+Enter aby zapisać, Escape aby anulować.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Front field */}
          <div className="space-y-2">
            <label htmlFor="front" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Przód fiszki
            </label>
            <textarea
              id="front"
              value={formData.front}
              onChange={(e) => setFormData(prev => ({ ...prev, front: e.target.value }))}
              placeholder="Wprowadź treść przodu fiszki..."
              className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
                errors.front ? 'border-red-500' : ''
              }`}
              rows={3}
            />
            <div className="flex justify-between items-center">
              {errors.front && (
                <span className="text-sm text-red-500">{errors.front}</span>
              )}
              <span className={`text-xs ml-auto ${formData.front.length > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.front.length}/200
              </span>
            </div>
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <label htmlFor="back" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tył fiszki
            </label>
            <textarea
              id="back"
              value={formData.back}
              onChange={(e) => setFormData(prev => ({ ...prev, back: e.target.value }))}
              placeholder="Wprowadź treść tyłu fiszki..."
              className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
                errors.back ? 'border-red-500' : ''
              }`}
              rows={5}
            />
            <div className="flex justify-between items-center">
              {errors.back && (
                <span className="text-sm text-red-500">{errors.back}</span>
              )}
              <span className={`text-xs ml-auto ${formData.back.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.back.length}/500
              </span>
            </div>
          </div>

          {/* Change indicator */}
          {hasChanges && (
            <div className="flex items-center text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Wykryto zmiany w treści fiszki
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges && Object.keys(errors).length === 0}
          >
            {hasChanges ? 'Zapisz zmiany' : 'Zamknij'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardModal;
