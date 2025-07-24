import React, { useState } from 'react';
import type { FlashcardDto } from '../../types';
import { Button } from '../ui/button';

interface FlashcardItemProps {
  flashcard: FlashcardDto;
  onUpdate: (id: number, updates: { front?: string; back?: string; source?: string }) => Promise<FlashcardDto>;
  onDelete: (id: number) => Promise<void>;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({
  flashcard,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    front: flashcard.front,
    back: flashcard.back
  });
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSaveEdit = async () => {
    try {
      await onUpdate(flashcard.id, {
        front: editForm.front,
        back: editForm.back,
        source: 'ai-edited'
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating flashcard:', error);
      alert('Nie udało się zaktualizować fiszki');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć tę fiszkę?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(flashcard.id);
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      alert('Nie udało się usunąć fiszki');
      setIsDeleting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai-full':
        return { text: '🤖 AI', color: 'bg-blue-100 text-blue-800' };
      case 'ai-edited':
        return { text: '✏️ Edytowane', color: 'bg-purple-100 text-purple-800' };
      case 'manual':
        return { text: '✋ Ręczne', color: 'bg-green-100 text-green-800' };
      default:
        return { text: '❓ Nieznane', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const sourceBadge = getSourceBadge(flashcard.source);

  if (isDeleting) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 opacity-50">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-red-600">Usuwanie...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
      {/* Header with source and actions */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${sourceBadge.color}`}>
          {sourceBadge.text}
        </span>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Obróć fiszkę"
          >
            🔄
          </button>
          
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Edytuj"
              >
                ✏️
              </button>
              
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Usuń"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Pytanie:
              </label>
              <textarea
                value={editForm.front}
                onChange={(e) => setEditForm({ ...editForm, front: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💡 Odpowiedź:
              </label>
              <textarea
                value={editForm.back}
                onChange={(e) => setEditForm({ ...editForm, back: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                ✅ Zapisz
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({ front: flashcard.front, back: flashcard.back });
                }}
                variant="outline"
                className="flex-1"
              >
                ❌ Anuluj
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Flashcard Content */}
            <div className="min-h-[120px] flex flex-col justify-center">
              {!isFlipped ? (
                <div>
                  <div className="text-sm text-gray-500 mb-2">📝 Pytanie:</div>
                  <div className="text-gray-900 font-medium">{flashcard.front}</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-500 mb-2">💡 Odpowiedź:</div>
                  <div className="text-gray-900">{flashcard.back}</div>
                </div>
              )}
            </div>

            {/* Flip button */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              {isFlipped ? '👀 Pokaż pytanie' : '💡 Pokaż odpowiedź'}
            </button>
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-xl">
        <div className="text-xs text-gray-500">
          📅 Utworzono: {new Date(flashcard.created_at).toLocaleDateString('pl-PL')}
          {flashcard.updated_at !== flashcard.created_at && (
            <span className="ml-2">
              ✏️ Edytowano: {new Date(flashcard.updated_at).toLocaleDateString('pl-PL')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;
