# API Endpoint Implementation Plan: Generate Flashcards

## 1. Przegląd punktu końcowego

Endpoint `/generations` pozwala na generowanie fiszek edukacyjnych na podstawie wprowadzonego tekstu przy wykorzystaniu modeli AI (dostępnych poprzez OpenRouter.ai). Użytkownik dostarcza tekst źródłowy (oraz opcjonalnie preferowany model AI), a system zwraca wygenerowane fiszki z pytaniami i odpowiedziami. Endpoint zapisuje również metadane dotyczące generacji w bazie danych dla celów analitycznych.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/generations`
- **Parametry**:
  - **Wymagane**:
    - `source_text`: String (1000-10000 znaków) - Tekst źródłowy do analizy i generowania fiszek
  - **Opcjonalne**:
    - `model`: String - Preferowany model AI do użycia (jeśli nie podano, użyj domyślnego)
- **Request Body**:
  ```typescript
  interface Request {
    source_text: string;     // Tekst źródłowy (1000-10000 znaków)
    model?: string;          // Opcjonalnie: model AI do użycia
  }
  ```
- **Nagłówki**:
  - `Authorization`: Bearer token JWT (wymagany)
  - `Content-Type`: application/json

## 3. Wykorzystywane typy

- **DTOs**:
  ```typescript
  // Request
  import { GenerateFlashcardsRequestDto } from '../types';
  
  // Response
  import { GenerateFlashcardsResponseDto, GeneratedFlashcardDto } from '../types';
  
  // Command Models
  import { GenerateFlashcardsCommand } from '../types';
  ```

- **Database Types**:
  ```typescript
  import { Tables, TablesInsert } from '../db/database.types';
  ```

## 4. Szczegóły odpowiedzi

- **Status Codes**:
  - `201 Created`: Pomyślne wygenerowanie fiszek
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. za krótki/długi tekst)
  - `401 Unauthorized`: Brak autoryzacji lub nieprawidłowy token
  - `503 Service Unavailable`: Błąd usługi AI

- **Response Body** (Status 201):
  ```typescript
  interface Response {
    generation_id: number;                // ID rekordu generacji w bazie danych
    flashcards: Array<{                   // Lista wygenerowanych fiszek
      id: number;                         // Tymczasowe ID (nie zapisane w DB)
      front: string;                      // Pytanie (przód fiszki)
      back: string;                       // Odpowiedź (tył fiszki)
      source: 'ai-full';                  // Źródło fiszki (zawsze 'ai-full' dla nowo wygenerowanych)
    }>;
    stats: {
      generated_count: number;            // Liczba wygenerowanych fiszek
      source_text_length: number;         // Długość tekstu źródłowego
    };
  }
  ```

- **Response Body** (Status 400, 401, 503):
  ```typescript
  interface ErrorResponse {
    error: string;                        // Ogólny opis błędu
    details?: string;                     // Szczegółowe informacje o błędzie (opcjonalne)
  }
  ```

## 5. Przepływ danych

1. **Walidacja żądania**:
   - Sprawdzenie poprawności tokenu JWT i identyfikacja użytkownika
   - Walidacja tekstu źródłowego (długość 1000-10000 znaków)
   - Walidacja opcjonalnego parametru modelu

2. **Przetwarzanie**:
   - Utworzenie rekordu w tabeli `generations`
   - Obliczenie hasha tekstu źródłowego dla śledzenia duplikatów
   - Przygotowanie promptu dla modelu AI

3. **Integracja z AI**:
   - Wysłanie żądania do OpenRouter.ai z odpowiednio sformatowanym promptem
   - Przetworzenie odpowiedzi AI na format fiszek

4. **Zarządzanie bazą danych**:
   - Aktualizacja rekordu generacji z informacjami statystycznymi
   - Fiszki NIE są jeszcze zapisywane w tabeli `flashcards` - zostaną zapisane dopiero po zatwierdzeniu przez użytkownika

5. **Przygotowanie odpowiedzi**:
   - Sformatowanie wygenerowanych fiszek zgodnie z formatem odpowiedzi
   - Zwrócenie ID generacji i statystyk

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie**:
   - Wszystkie żądania muszą zawierać prawidłowy token JWT Supabase
   - Wykorzystanie middleware Astro do walidacji tokenu przed wykonaniem endpointu

2. **Autoryzacja**:
   - Użytkownik jest identyfikowany na podstawie JWT
   - User ID jest automatycznie pobierany z tokenu i używany przy tworzeniu rekordów

3. **Walidacja danych**:
   - Tekst źródłowy musi być między 1000 a 10000 znaków (zgodnie z ograniczeniami DB)
   - Należy sanityzować tekst przed wysłaniem do API AI
   - Wykorzystanie biblioteki zod do walidacji schematu danych wejściowych

4. **Bezpieczeństwo zapytań AI**:
   - Unikanie prompt injection przez odpowiednią sanityzację tekstu wejściowego
   - Ograniczenie kosztów przez ustawienie limitów dla kluczy API OpenRouter.ai

## 7. Obsługa błędów

1. **Walidacja wejściowa**:
   - **400 Bad Request**: Tekst źródłowy za krótki/długi
   - **400 Bad Request**: Nieprawidłowy format danych wejściowych

2. **Błędy autoryzacji**:
   - **401 Unauthorized**: Brak tokenu JWT lub token wygasł
   - **401 Unauthorized**: Nieprawidłowy token

3. **Błędy usługi AI**:
   - **503 Service Unavailable**: Usługa OpenRouter.ai niedostępna
   - **503 Service Unavailable**: Przekroczony limit kosztów dla usługi AI
   - **503 Service Unavailable**: Model AI zwrócił nieprawidłowe dane

4. **Błędy bazy danych**:
   - **500 Internal Server Error**: Problemy z zapisem/odczytem z bazy danych

5. **Rejestrowanie błędów**:
   - Wszystkie błędy związane z generacją AI są zapisywane w tabeli `generation_error_logs`
   - Dla każdego błędu zapisywane są: user_id, model, hash tekstu, długość tekstu, kod błędu, wiadomość błędu

## 8. Rozważania dotyczące wydajności

1. **Obsługa dużych żądań**:
   - Potencjalnie długi czas oczekiwania na odpowiedź od API AI - należy rozważyć implementację mechanizmu długotrwałych zadań
   - Prawidłowe ustawienie timeoutów dla żądań HTTP do OpenRouter.ai

2. **Pamięć podręczna**:
   - Rozważyć cachowanie odpowiedzi dla identycznych tekstów źródłowych (wykorzystując hash tekstu)
   - Implementacja TTL (time-to-live) dla cachowanych odpowiedzi

3. **Równoległość**:
   - Endpointy Astro są domyślnie blokujące - rozważyć użycie wzorca streamu dla długotrwałych operacji
   - Rozważyć buforowanie częściowych wyników podczas generacji fiszek

4. **Ograniczenie szybkości**:
   - Implementacja rate limitingu dla tego endpointu, aby zapobiec nadużyciom
   - Monitorowanie użycia zasobów przez poszczególnych użytkowników

## 9. Etapy wdrożenia

1. **Utworzenie podstawowej struktury plików**:
   - Utworzenie pliku `src/pages/api/generations.ts`
   - Utworzenie pliku `src/lib/services/ai.service.ts` dla logiki związanej z AI
   - Utworzenie pliku `src/lib/services/generation.service.ts` dla logiki związanej z bazą danych

2. **Implementacja schematu walidacji**:
   - Utworzenie schematu Zod dla walidacji danych wejściowych

3. **Implementacja warstwy usług**:
   - Implementacja `AIService` do komunikacji z OpenRouter.ai
   - Implementacja `GenerationService` do interakcji z bazą danych
   - Implementacja logiki parsowania tekstu i generowania fiszek

4. **Implementacja handlerów API**:
   - Implementacja głównego handlera POST
   - Integracja z middleware Astro do uwierzytelniania

5. **Implementacja obsługi błędów**:
   - Implementacja logiki zapisywania błędów w tabeli `generation_error_logs`
   - Implementacja odpowiednich odpowiedzi na błędy

7. **Dokumentacja**:
   - Aktualizacja dokumentacji API
   - Dodanie przykładów użycia dla frontend developerów

## 10. Przykładowa implementacja

### Struktura plików

```
src/
├── pages/
│   └── api/
│       └── generations.ts      # Endpoint API do generowania fiszek
├── lib/
│   ├── services/
│   │   ├── ai.service.ts       # Serwis do integracji z OpenRouter.ai
│   │   └── generation.service.ts # Serwis do operacji na bazie danych
│   └── utils/
│       └── hash.ts             # Funkcje pomocnicze do generowania hashy
├── db/
│   └── ...                     # Istniejące pliki bazy danych
└── types.ts                    # Już istniejące typy
```

### Główny endpoint API (`src/pages/api/generations.ts`):

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createHash } from 'crypto';
import { AIService } from '../../lib/services/ai.service';
import { GenerationService } from '../../lib/services/generation.service';
import type { GenerateFlashcardsRequestDto, GenerateFlashcardsResponseDto } from '../../types';

// Schema walidacji dla danych wejściowych
const generateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(1000, "Tekst źródłowy musi mieć co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
  model: z.string().optional()
});

// Domyślny model jeśli nie podano
const DEFAULT_AI_MODEL = 'gpt-3.5-turbo';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Autoryzacja użytkownika
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Valid session required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id;
    
    // 2. Walidacja danych wejściowych
    const requestData = await request.json();
    const validationResult = generateFlashcardsSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.format() 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { source_text, model = DEFAULT_AI_MODEL } = validationResult.data;
    
    // 3. Tworzenie hash dla tekstu źródłowego
    const source_text_hash = createHash('sha256').update(source_text).digest('hex');
    const source_text_length = source_text.length;
    
    // 4. Inicjalizacja serwisów
    const aiService = new AIService();
    const generationService = new GenerationService(supabase);
    
    // 5. Utworzenie rekordu generacji
    const generationId = await generationService.createGeneration({
      user_id: userId,
      model,
      source_text_hash,
      source_text_length,
    });
    
    try {
      // 6. Generowanie fiszek przy użyciu AI
      const generatedFlashcards = await aiService.generateFlashcards(source_text, model);
      
      // 7. Aktualizacja rekordu generacji z liczbą wygenerowanych fiszek
      await generationService.updateGenerationStats(generationId, {
        generated_count: generatedFlashcards.length
      });
      
      // 8. Przygotowanie odpowiedzi
      const response: GenerateFlashcardsResponseDto = {
        generation_id: generationId,
        flashcards: generatedFlashcards.map((flashcard, index) => ({
          id: index + 1, // Tymczasowe ID
          front: flashcard.front,
          back: flashcard.back,
          source: 'ai-full' as const
        })),
        stats: {
          generated_count: generatedFlashcards.length,
          source_text_length
        }
      };
      
      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (aiError: any) {
      // 9. Rejestrowanie błędu AI
      await generationService.logGenerationError({
        user_id: userId,
        model,
        source_text_hash,
        source_text_length,
        error_code: aiError.code || 'UNKNOWN',
        error_message: aiError.message || String(aiError)
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'AI Service Error', 
          details: aiError.message || 'Failed to generate flashcards' 
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error: any) {
    console.error('Generation endpoint error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Wyłączenie prerenderowania dla tego endpointu
export const prerender = false;
```
