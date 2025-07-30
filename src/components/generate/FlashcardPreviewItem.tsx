import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FlashcardPreviewItemProps } from "../../types";

const FlashcardPreviewItem: React.FC<FlashcardPreviewItemProps> = ({ flashcard, onAction }) => {
  const getStatusColor = () => {
    switch (flashcard.status) {
      case "accepted":
        return "border-green-500 bg-green-50";
      case "edited":
        return "border-blue-500 bg-blue-50";
      case "rejected":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getStatusBadge = () => {
    switch (flashcard.status) {
      case "accepted":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Zaakceptowana
          </span>
        );
      case "edited":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Edytowana
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Odrzucona
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Oczekująca
          </span>
        );
    }
  };

  const displayFront = flashcard.isEdited ? flashcard.editedFront : flashcard.front;
  const displayBack = flashcard.isEdited ? flashcard.editedBack : flashcard.back;

  return (
    <Card className={`transition-all duration-200 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Fiszka #{flashcard.id}</CardTitle>
          {getStatusBadge()}
        </div>
        {flashcard.isEdited && (
          <div className="flex items-center text-xs text-blue-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edytowana
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Front side */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Przód</label>
          <p className="text-sm bg-white p-3 rounded border min-h-[60px] break-words">{displayFront}</p>
        </div>

        {/* Back side */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tył</label>
          <p className="text-sm bg-white p-3 rounded border min-h-[60px] break-words">{displayBack}</p>
        </div>

        {/* Action buttons */}
        {flashcard.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onAction("accept")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Akceptuj
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onAction("edit")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edytuj
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onAction("reject")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Odrzuć
            </Button>
          </div>
        )}

        {/* Actions for accepted/edited cards */}
        {(flashcard.status === "accepted" || flashcard.status === "edited") && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onAction("edit")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edytuj ponownie
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onAction("reject")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Odrzuć
            </Button>
          </div>
        )}

        {/* Actions for rejected cards */}
        {flashcard.status === "rejected" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onAction("accept")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Przywróć
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onAction("edit")}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edytuj
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FlashcardPreviewItem;
