import React, { useState } from 'react';
import type { FlashcardDto } from '../../types';
import FlashcardItem from './FlashcardItem.tsx';

interface FlashcardsListProps {
  flashcards: FlashcardDto[];
  onUpdate: (id: number, updates: { front?: string; back?: string; source?: string }) => Promise<FlashcardDto>;
  onDelete: (id: number) => Promise<void>;
  onReload: () => Promise<void>;
}

const FlashcardsList: React.FC<FlashcardsListProps> = ({
  flashcards,
  onUpdate,
  onDelete,
  onReload
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Filter flashcards based on search term
  const filteredFlashcards = flashcards.filter(card =>
    card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.back.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort flashcards
  const sortedFlashcards = [...filteredFlashcards].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'alphabetical':
        return a.front.localeCompare(b.front);
      default:
        return 0;
    }
  });

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">📚</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Brak fiszek</h3>
        <p className="text-gray-500 mb-6">
          Nie masz jeszcze żadnych fiszek. Rozpocznij od wygenerowania nowych!
        </p>
        <a 
          href="/generate"
          className="inline-flex items-center px-6 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          🚀 Generuj pierwsze fiszki
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              📚 Twoje fiszki ({flashcards.length})
            </h2>
            <p className="text-gray-600">
              {filteredFlashcards.length !== flashcards.length && 
                `Pokazuje ${filteredFlashcards.length} z ${flashcards.length} fiszek`
              }
            </p>
          </div>
          
          <button
            onClick={onReload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Odśwież
          </button>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Szukaj w fiszkach..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">📅 Najnowsze</option>
            <option value="oldest">📅 Najstarsze</option>
            <option value="alphabetical">🔤 Alfabetycznie</option>
          </select>
        </div>
      </div>

      {/* Flashcards Grid */}
      {sortedFlashcards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Brak fiszek pasujących do wyszukiwania "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedFlashcards.map((flashcard) => (
            <FlashcardItem
              key={flashcard.id}
              flashcard={flashcard}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardsList;
