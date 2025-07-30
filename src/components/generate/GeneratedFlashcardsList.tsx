import React from "react";
import FlashcardPreviewItem from "./FlashcardPreviewItem";
import type { GeneratedFlashcardsListProps, FlashcardAction } from "../../types";

const GeneratedFlashcardsList: React.FC<GeneratedFlashcardsListProps> = ({ flashcards, onFlashcardAction }) => {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Brak fiszek</h3>
        <p className="text-gray-500">Wprowadź tekst i kliknij &quot;Generuj fiszki&quot;, aby rozpocząć.</p>
      </div>
    );
  }

  const pendingCount = flashcards.filter((f) => f.status === "pending").length;
  const acceptedCount = flashcards.filter((f) => f.status === "accepted").length;
  const editedCount = flashcards.filter((f) => f.status === "edited").length;
  const rejectedCount = flashcards.filter((f) => f.status === "rejected").length;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      {/* Header with statistics */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Wygenerowane fiszki ({flashcards.length})</h2>
        <div className="flex flex-wrap justify-center gap-6 text-sm bg-gray-50 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span className="text-gray-700">
              <span className="font-semibold text-amber-600">{pendingCount}</span> oczekujących
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-gray-700">
              <span className="font-semibold text-green-600">{acceptedCount}</span> zaakceptowanych
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-gray-700">
              <span className="font-semibold text-blue-600">{editedCount}</span> edytowanych
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-gray-700">
              <span className="font-semibold text-red-600">{rejectedCount}</span> odrzuconych
            </span>
          </div>
        </div>
      </div>

      {/* Flashcards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {flashcards.map((flashcard) => (
          <FlashcardPreviewItem
            key={flashcard.id}
            flashcard={flashcard}
            onAction={(action: FlashcardAction) => onFlashcardAction(flashcard.id, action)}
          />
        ))}
      </div>

      {/* Help text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          💡 Przeglądnij fiszki, akceptuj te, które Ci się podobają, edytuj te, które wymagają poprawek, lub odrzuć
          niepotrzebne.
        </p>
      </div>
    </div>
  );
};

export default GeneratedFlashcardsList;
