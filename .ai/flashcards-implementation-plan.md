# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego

Endpoint `POST /api/flashcards` umożliwia tworzenie jednej lub wielu fiszek w systemie. Fiszki mogą być tworzone ręcznie przez użytkownika lub na podstawie wcześniejszych generacji AI. Endpoint waliduje dane wejściowe, zapisuje fiszki w bazie danych i zwraca utworzone rekordy wraz z przypisanymi identyfikatorami.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Parametry**:
  - Wymagane: Brak parametrów URL
  - Opcjonalne: Brak parametrów URL
- **Request Body**:
  ```json
  {
    "flashcards": [
      {
        "front": "string",
        "back": "string",
        "source": "string", // "manual", "ai-full", or "ai-edited"
        "generation_id": "integer | null"
      }
    ]
  }
  ```

## 3. Wykorzystywane typy

### DTO (Data Transfer Objects)
- `CreateFlashcardDto`: Reprezentuje pojedynczą fiszkę przesłaną przez klienta
- `CreateFlashcardsRequestDto`: Reprezentuje żądanie zawierające tablicę fiszek do utworzenia
- `FlashcardDto`: Reprezentuje fiszkę z wszystkimi danymi włącznie z ID
- `CreateFlashcardsResponseDto`: Reprezentuje odpowiedź zawierającą utworzone fiszki i ich liczbę

### Command Models
- `CreateFlashcardCommand`: Reprezentuje komendę tworzenia fiszki w systemie

### Inne typy
- `TablesInsert<"flashcards">`: Typ reprezentujący strukturę danych dla operacji INSERT w tabeli flashcards
- `FlashcardSource`: Typ wyliczeniowy dla źródła fiszki ('ai-full' | 'ai-edited' | 'manual')

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)
```json
{
  "data": [
    {
      "id": "integer",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "generation_id": "integer | null",
      "user_id": "uuid"
    }
  ],
  "count": "integer"
}
```

### Błędy
- **400 Bad Request**: Nieprawidłowe dane wejściowe (nieprawidłowy format JSON, brak wymaganych pól, nieprawidłowe dane)
- **401 Unauthorized**: Użytkownik nie jest zalogowany
- **500 Internal Server Error**: Wewnętrzny błąd serwera podczas przetwarzania żądania

## 5. Przepływ danych

1. Żądanie POST jest odbierane przez endpoint `/api/flashcards`
2. Middleware Astro wstrzykuje klienta Supabase do kontekstu żądania
3. Endpoint dekoduje body żądania i waliduje format danych przy użyciu Zod
4. Serwis FlashcardService jest używany do zapisania nowych fiszek w bazie danych
5. Każda fiszka jest walidowana pod kątem spójności danych oraz wymaganych pól
6. Utworzone fiszki są zwracane do klienta wraz z przypisanymi identyfikatorami

## 6. Względy bezpieczeństwa

1. **Autentykacja**:
   - Wymaga ważnej sesji użytkownika (obsługiwanej przez Supabase)
   - ID użytkownika jest pobierane z sesji, nie z danych wejściowych

2. **Autoryzacja**:
   - Użytkownicy mogą tworzyć fiszki tylko dla własnych kont
   - Przy podaniu generation_id należy sprawdzić, czy należy do aktualnego użytkownika

3. **Walidacja danych**:
   - Sprawdzenie, czy źródło fiszki jest jednym z dozwolonych typów ('ai-full', 'ai-edited', 'manual')
   - Sprawdzenie, czy teksty na froncie i tyle fiszki nie przekraczają ustalonych limitów
   - Sprawdzenie, czy podane generation_id odnosi się do istniejącego rekordu należącego do użytkownika

4. **Sanityzacja danych**:
   - Usuwanie potencjalnie niebezpiecznych znaków z tekstów fiszek

## 7. Obsługa błędów

1. **Nieprawidłowe dane wejściowe (400 Bad Request)**:
   - Nieprawidłowy format JSON
   - Brak wymaganych pól (flashcards, front, back, source)
   - Nieprawidłowy format danych (np. source spoza dozwolonych wartości)
   - Zbyt długi tekst w polach front/back
   - Pusta tablica flashcards

2. **Nieautoryzowany dostęp (401 Unauthorized)**:
   - Brak ważnej sesji użytkownika

3. **Błędy bazy danych (500 Internal Server Error)**:
   - Problemy z zapisem do bazy danych
   - Problemy z walidacją ograniczeń bazy danych (np. referencje do nieistniejących generacji)

4. **Obsługa wyjątków**:
   - Wszystkie nieoczekiwane wyjątki są łapane i logowane
   - Użytkownikowi zwracany jest ogólny komunikat błędu (bez szczegółów technicznych)

## 8. Rozważania dotyczące wydajności

1. **Transakcje bazodanowe**:
   - Używanie transakcji do zapisywania wielu fiszek w jednej operacji bazodanowej

2. **Paginacja**:
   - Ograniczenie maksymalnej liczby fiszek, które można utworzyć w jednym żądaniu (np. 100)

3. **Optymalizacja zapytań**:
   - Grupowanie operacji INSERT dla lepszej wydajności

4. **Walidacja wstępna**:
   - Szybka walidacja podstawowych wymagań przed przejściem do operacji bazodanowych

## 9. Etapy wdrożenia

1. **Utworzenie pliku endpointu**:
   - Utworzenie pliku `src/pages/api/flashcards.ts`
   - Zdefiniowanie metody POST z obsługą pre-renderowania

2. **Utworzenie serwisu FlashcardService**:
   - Utworzenie pliku `src/lib/services/flashcard.service.ts`
   - Implementacja metod do obsługi tworzenia fiszek

3. **Implementacja walidacji**:
   - Zdefiniowanie schematów Zod dla walidacji danych wejściowych
   - Implementacja logiki walidacji w endpoincie

4. **Implementacja logiki biznesowej**:
   - Mapowanie danych wejściowych na Command Model
   - Wywołanie odpowiednich metod serwisu

5. **Obsługa błędów**:
   - Implementacja obsługi błędów walidacji i bazodanowych
   - Logowanie błędów i zwracanie odpowiednich statusów HTTP

6. **Testy**:
   - Ręczne testowanie endpointu z różnymi scenariuszami danych wejściowych
   - Testowanie obsługi błędów

7. **Dokumentacja**:
   - Dodanie komentarzy JSDoc do kodu
   - Aktualizacja dokumentacji API (jeśli istnieje)
