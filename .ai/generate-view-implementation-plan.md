# Plan implementacji widoku generowania fiszek

## 1. Przegląd

Widok generowania fiszek umożliwia użytkownikom tworzenie fiszek edukacyjnych przy użyciu sztucznej inteligencji. Użytkownik wkleja tekst źródłowy (1000-10000 znaków), system generuje propozycje fiszek, które następnie mogą być zaakceptowane, edytowane lub odrzucone. Zaakceptowane fiszki są zapisywane w bazie danych użytkownika.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/generate` jako strona Astro z komponentami React dla interaktywnych części interfejsu.

## 3. Struktura komponentów

```
GenerateFlashcardsPage (Astro)
└── GenerateFlashcardsView (React)
    ├── TextInputSection
    │   ├── Textarea (Shadcn/ui)
    │   ├── CharacterCounter
    │   └── GenerateButton (Shadcn/ui)
    ├── GeneratedFlashcardsList
    │   ├── FlashcardPreviewItem (wielokrotnie)
    │   │   ├── FlashcardContent
    │   │   └── ActionButtons
    │   └── EmptyState
    ├── EditFlashcardModal
    │   ├── Dialog (Shadcn/ui)
    │   ├── FlashcardEditForm
    │   └── DialogActions
    └── SaveActionsSection
        ├── SaveAllButton
        └── ActionsSummary
```

## 4. Szczegóły komponentów

### GenerateFlashcardsView
- **Opis komponentu**: Główny kontener zarządzający stanem całego widoku generowania fiszek
- **Główne elementy**: Container div z sekcjami dla wprowadzania tekstu, listy fiszek i akcji zapisu
- **Obsługiwane interakcje**: Generowanie fiszek, zarządzanie stanem fiszek, zapisywanie
- **Obsługiwana walidacja**: Walidacja długości tekstu źródłowego (1000-10000 znaków), sprawdzanie dostępności fiszek do zapisu
- **Typy**: `GenerateViewState`, `GenerateFlashcardsResponseDto`, `CreateFlashcardsRequestDto`
- **Propsy**: Brak (komponent główny)

### TextInputSection
- **Opis komponentu**: Sekcja zawierająca pole tekstowe z walidacją i przycisk generowania
- **Główne elementy**: Textarea, licznik znaków, przycisk generowania, komunikaty błędów
- **Obsługiwane interakcje**: Wprowadzanie tekstu, walidacja w czasie rzeczywistym, wywołanie generowania
- **Obsługiwana walidacja**: Długość tekstu (1000-10000 znaków), sprawdzanie pustych wartości
- **Typy**: `TextInputProps`, `ValidationError`
- **Propsy**: `value: string`, `onChange: (value: string) => void`, `onGenerate: () => void`, `isGenerating: boolean`, `errors: string[]`

### GeneratedFlashcardsList
- **Opis komponentu**: Lista wygenerowanych fiszek z możliwością zarządzania każdą z nich
- **Główne elementy**: Container dla listy, FlashcardPreviewItem dla każdej fiszki, EmptyState gdy brak fiszek
- **Obsługiwane interakcje**: Wyświetlanie fiszek, przekazywanie akcji do elementów potomnych
- **Obsługiwana walidacja**: Sprawdzanie czy istnieją fiszki do wyświetlenia
- **Typy**: `FlashcardViewState[]`, `FlashcardActionHandler`
- **Propsy**: `flashcards: FlashcardViewState[]`, `onFlashcardAction: (id: number, action: FlashcardAction) => void`

### FlashcardPreviewItem
- **Opis komponentu**: Pojedyncza karta fiszki z podglądem treści i przyciskami akcji
- **Główne elementy**: Card container, front/back content display, action buttons (akceptuj, edytuj, odrzuć), status indicator
- **Obsługiwane interakcje**: Kliknięcie przycisków akcji, wizualna zmiana stanu
- **Obsługiwana walidacja**: Sprawdzanie aktualnego statusu fiszki, walidacja czy można wykonać akcję
- **Typy**: `FlashcardViewState`, `FlashcardAction`
- **Propsy**: `flashcard: FlashcardViewState`, `onAction: (action: FlashcardAction) => void`

### EditFlashcardModal
- **Opis komponentu**: Modal do edycji treści fiszki z formularzem i walidacją
- **Główne elementy**: Dialog overlay, form z polami front/back, przyciski zapisz/anuluj, komunikaty błędów
- **Obsługiwane interakcje**: Edycja tekstu, zapisywanie zmian, zamykanie modala, obsługa klawiszy (Escape)
- **Obsługiwana walidacja**: Długość front (1-200 znaków), długość back (1-500 znaków), sprawdzanie czy wprowadzono zmiany
- **Typy**: `EditModalState`, `EditFlashcardData`, `ValidationError`
- **Propsy**: `isOpen: boolean`, `flashcard: FlashcardViewState | null`, `onSave: (data: EditFlashcardData) => void`, `onClose: () => void`

### SaveActionsSection
- **Opis komponentu**: Sekcja z akcjami zapisu i podsumowaniem stanu fiszek
- **Główne elementy**: Button dla zapisu wszystkich zatwierdzonych, podsumowanie liczby fiszek w różnych stanach, loading indicator
- **Obsługiwane interakcje**: Zapisywanie zaakceptowanych fiszek, wyświetlanie postępu
- **Obsługiwana walidacja**: Sprawdzanie czy istnieją fiszki do zapisu (status accepted lub edited)
- **Typy**: `SaveState`, `FlashcardViewState[]`
- **Propsy**: `flashcards: FlashcardViewState[]`, `onSaveAll: () => void`, `isSaving: boolean`

## 5. Typy

### Nowe typy ViewModel:

```typescript
// Stan pojedynczej fiszki w widoku
type FlashcardViewState = {
  id: number;
  front: string;
  back: string;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  originalFront: string;
  originalBack: string;
  isEdited: boolean;
}

// Stan głównego widoku generowania
type GenerateViewState = {
  sourceText: string;
  isGenerating: boolean;
  generationId: number | null;
  flashcards: FlashcardViewState[];
  errors: string[];
  isSaving: boolean;
}

// Stan modala edycji
type EditModalState = {
  isOpen: boolean;
  flashcardId: number | null;
  editData: { front: string; back: string } | null;
}

// Typy akcji dla fiszek
type FlashcardAction = 'accept' | 'edit' | 'reject';

// Typ dla obsługi akcji
type FlashcardActionHandler = (id: number, action: FlashcardAction) => void;

// Dane edycji fiszki
type EditFlashcardData = {
  front: string;
  back: string;
}

// Stan walidacji
type ValidationError = {
  field: string;
  message: string;
}

// Propsy dla komponentów
type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  errors: string[];
}
```

### Istniejące typy z types.ts:
- `GenerateFlashcardsRequestDto`
- `GenerateFlashcardsResponseDto` 
- `GeneratedFlashcardDto`
- `CreateFlashcardsRequestDto`
- `CreateFlashcardsResponseDto`
- `FlashcardSource`

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany przez custom hook `useGenerateFlashcards` który enkapsuluje logikę biznesową:

```typescript
const useGenerateFlashcards = () => {
  const [viewState, setViewState] = useState<GenerateViewState>({
    sourceText: '',
    isGenerating: false,
    generationId: null,
    flashcards: [],
    errors: [],
    isSaving: false
  });
  
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    flashcardId: null,
    editData: null
  });

  // Funkcje: generateFlashcards, updateFlashcardStatus, saveFlashcards, etc.
  return { viewState, editModal, actions };
}
```

Hook będzie zawierać funkcje:
- `generateFlashcards(sourceText: string)` - wywołanie API generowania
- `updateFlashcardStatus(id: number, action: FlashcardAction)` - zmiana statusu fiszki
- `editFlashcard(id: number, data: EditFlashcardData)` - edycja treści fiszki
- `saveFlashcards()` - zapisanie zaakceptowanych fiszek
- `resetView()` - reset stanu widoku

## 7. Integracja API

### Generowanie fiszek:
- **Endpoint**: `POST /api/generations`
- **Request type**: `GenerateFlashcardsRequestDto`
- **Response type**: `GenerateFlashcardsResponseDto`
- **Wywołanie**: Po kliknięciu przycisku "Generuj fiszki" z walidacją długości tekstu

### Zapisywanie fiszek:
- **Endpoint**: `POST /api/flashcards`  
- **Request type**: `CreateFlashcardsRequestDto`
- **Response type**: `CreateFlashcardsResponseDto`
- **Wywołanie**: Po kliknięciu "Zapisz wszystkie zatwierdzone" z przekształceniem fiszek ze statusem accepted/edited

Funkcje API będą wywoływane przez async/await z odpowiednią obsługą błędów i loading states.

## 8. Interakcje użytkownika

1. **Wprowadzanie tekstu**: 
   - Użytkownik wpisuje/wkleja tekst w textarea
   - Licznik znaków aktualizuje się w czasie rzeczywistym
   - Walidacja długości (1000-10000) z komunikatami błędów

2. **Generowanie fiszek**:
   - Kliknięcie przycisku "Generuj fiszki"
   - Loading state podczas wywołania API
   - Wyświetlenie wygenerowanych fiszek lub komunikatu błędu

3. **Zarządzanie fiszkami**:
   - Kliknięcie "Akceptuj" (✓) - zmiana statusu na accepted
   - Kliknięcie "Edytuj" (✏️) - otwarcie modala edycji
   - Kliknięcie "Odrzuć" (✗) - zmiana statusu na rejected

4. **Edycja fiszki**:
   - Otwarcie modala z formularzem
   - Edycja pól front/back z walidacją
   - Zapisanie zmian lub anulowanie

5. **Zapisywanie**:
   - Kliknięcie "Zapisz wszystkie zatwierdzone"
   - Loading state podczas zapisu
   - Komunikat sukcesu lub błędu

## 9. Warunki i walidacja

### TextInputSection:
- **Warunek**: Długość tekstu 1000-10000 znaków
- **Wpływ**: Blokowanie przycisku generowania, wyświetlanie komunikatu błędu
- **Implementacja**: Real-time walidacja z debounce

### GenerateButton:
- **Warunek**: Poprawna długość tekstu + brak aktywnego generowania
- **Wpływ**: Disabled state przycisku
- **Implementacja**: `disabled={!isValidText || isGenerating}`

### EditFlashcardModal:
- **Warunki**: Front (1-200 znaków), Back (1-500 znaków)
- **Wpływ**: Blokowanie zapisania, wyświetlanie błędów walidacji
- **Implementacja**: Walidacja po onBlur i przed submitem

### SaveActionsSection:
- **Warunek**: Minimum 1 fiszka ze statusem accepted lub edited
- **Wpływ**: Disabled state przycisku zapisu
- **Implementacja**: `disabled={acceptedFlashcards.length === 0}`

## 10. Obsługa błędów

### Błędy walidacji:
- **Tekst za krótki/długi**: Inline message pod textarea
- **Puste pola w modalu**: Error messages przy polach formularza

### Błędy API:
- **503 Service Unavailable**: "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie." + retry button
- **400 Bad Request**: "Nieprawidłowe dane. Sprawdź wprowadzony tekst."
- **401 Unauthorized**: Przekierowanie do logowania

### Błędy sieciowe:
- **Network error**: "Problemy z połączeniem. Sprawdź internet i spróbuj ponownie."
- **Timeout**: "Operacja trwa zbyt długo. Spróbuj ponownie."

### Błędy zapisu:
- **Częściowy sukces**: "Część fiszek została zapisana. Sprawdź wyniki."
- **Całkowity błąd**: "Nie udało się zapisać fiszek. Spróbuj ponownie."

Wszystkie błędy będą wyświetlane jako toast notifications lub inline messages z możliwością retry gdzie to możliwe.

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - `/src/pages/generate.astro` - główna strona
   - `/src/components/generate/` - folder dla komponentów React

2. **Implementacja custom hook**:
   - `useGenerateFlashcards` z podstawowym stanem
   - Funkcje API calls z error handlingiem

3. **Implementacja TextInputSection**:
   - Textarea z Shadcn/ui
   - Character counter komponent
   - Real-time walidacja

4. **Implementacja GeneratedFlashcardsList**:
   - FlashcardPreviewItem z akcjami
   - Empty state komponent
   - Status indicators

5. **Implementacja EditFlashcardModal**:
   - Dialog z Shadcn/ui
   - Form z walidacją pól
   - Focus management

6. **Implementacja SaveActionsSection**:
   - Save button z loading states
   - Summary informacji o fiszkach

7. **Integracja API**:
   - Połączenie z endpointami
   - Error handling dla wszystkich scenariuszy

8. **Styling i responsywność**:
   - Tailwind CSS classes
   - Mobile-first approachfFla
   - Loading states i animacje

9. **Testy i optymalizacja**:
   - Unit testy dla custom hook
   - Integration testy dla API calls
   - Performance optimization z React.memo

10. **Accessibility**:
    - ARIA labels dla wszystkich interaktywnych elementów
    - Keyboard navigation
    - Screen reader support
