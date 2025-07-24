import React from 'react';
import { Button } from '@/components/ui/button';
import type { TextInputProps } from '../../types';

const TextInputSection: React.FC<TextInputProps> = ({
  value,
  onChange,
  onGenerate,
  isGenerating,
  errors
}) => {
  const characterCount = value.length;
  const minChars = 1000;
  const maxChars = 10000;
  
  const isValid = characterCount >= minChars && characterCount <= maxChars;
  const isDisabled = !isValid || isGenerating;

  const getCharacterCountColor = () => {
    if (characterCount < minChars) return 'text-red-500';
    if (characterCount > maxChars) return 'text-red-500';
    return 'text-green-600';
  };

  const getCharacterCountText = () => {
    if (characterCount < minChars) {
      return `${characterCount}/${minChars} (minimum)`;
    }
    if (characterCount > maxChars) {
      return `${characterCount}/${maxChars} (przekroczono limit)`;
    }
    return `${characterCount}/${maxChars}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wprowadź tekst</h2>
          <p className="text-gray-600">Wklej materiał, z którego chcesz utworzyć fiszki</p>
        </div>

        <div className="space-y-3">
          <label htmlFor="source-text" className="text-sm font-semibold text-gray-700 block">
            Tekst źródłowy *
          </label>
          <div className="relative">
            <textarea
              id="source-text"
              placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (minimum 1000 znaków)..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full min-h-[240px] p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-y"
              disabled={isGenerating}
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-600 font-medium">Generowanie...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Character count indicator */}
          <div className="flex justify-between items-center pt-2">
            <div className={`text-sm font-medium ${getCharacterCountColor()}`}>
              {getCharacterCountText()}
            </div>
            <div className="flex items-center space-x-2">
              {characterCount < minChars && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Potrzebujesz więcej tekstu
                </span>
              )}
              {characterCount > maxChars && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Za dużo tekstu
                </span>
              )}
              {isValid && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  ✓ Gotowe do generowania
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                characterCount < minChars 
                  ? 'bg-amber-400' 
                  : characterCount > maxChars 
                    ? 'bg-red-400' 
                    : 'bg-green-400'
              }`}
              style={{ 
                width: `${Math.min((characterCount / maxChars) * 100, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">
                ⚠ {error}
              </p>
            ))}
          </div>
        )}

        {/* Generate button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onGenerate}
            disabled={isDisabled}
            className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Generowanie fiszek...
              </>
            ) : (
              <>
                🤖 Generuj fiszki AI
              </>
            )}
          </Button>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            AI przeanalizuje tekst i wygeneruje inteligentne fiszki edukacyjne. 
            Możesz następnie wybrać, które chcesz zapisać lub edytować.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextInputSection;
