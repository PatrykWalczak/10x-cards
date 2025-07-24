import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SaveActionsSectionProps } from '../../types';

const SaveActionsSection: React.FC<SaveActionsSectionProps> = ({
  flashcards,
  onSaveAll,
  isSaving
}) => {
  const acceptedCount = flashcards.filter(f => f.status === 'accepted').length;
  const editedCount = flashcards.filter(f => f.status === 'edited').length;
  const totalToSave = acceptedCount + editedCount;
  const pendingCount = flashcards.filter(f => f.status === 'pending').length;
  const rejectedCount = flashcards.filter(f => f.status === 'rejected').length;

  const canSave = totalToSave > 0;

  return (
    <Card className="bg-gray-50 border-2 border-dashed border-gray-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Podsumowanie fiszek</h3>
            <p className="text-sm text-gray-600">
              Sprawdź stan swoich fiszek i zapisz wybrane
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Zaakceptowanych</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{editedCount}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Edytowanych</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Oczekujących</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Odrzuconych</div>
            </div>
          </div>

          {/* Save section */}
          <div className="border-t pt-4">
            {canSave ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    Gotowe do zapisu: <strong>{totalToSave}</strong> {totalToSave === 1 ? 'fiszka' : 'fiszek'}
                  </span>
                </div>
                
                <Button 
                  onClick={onSaveAll}
                  disabled={isSaving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Zapisz {totalToSave} {totalToSave === 1 ? 'fiszkę' : 'fiszek'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Zapisane zostaną tylko zaakceptowane i edytowane fiszki
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Brak fiszek do zapisu
                  </span>
                </div>
                
                <p className="text-xs text-gray-500">
                  Zaakceptuj lub edytuj przynajmniej jedną fiszkę, aby móc je zapisać
                </p>
                
                <Button 
                  disabled
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Zapisz fiszki
                </Button>
              </div>
            )}
          </div>

          {/* Progress indicator for pending cards */}
          {pendingCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-yellow-800">
                  Masz jeszcze <strong>{pendingCount}</strong> {pendingCount === 1 ? 'fiszkę' : 'fiszek'} do przejrzenia
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SaveActionsSection;
