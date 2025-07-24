# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards wykorzystuje architekturę SPA (Single Page Application) opartą na React/Astro z biblioteką komponentów Shadcn/ui i Tailwind CSS. Struktura UI jest zaprojektowana wokół głównych przepływów: generowania fiszek przez AI, ręcznego zarządzania fiszkami oraz nauki z wykorzystaniem algorytmu spaced repetition. 

Aplikacja implementuje system autoryzacji oparty na Supabase Auth z wykorzystaniem JWT tokenów. Stan aplikacji jest zarządzany przez React Context z możliwością przyszłego rozszerzenia o Zustand. Interfejs jest w pełni responsywny (breakpointy sm:, md:, lg:) i zgodny ze standardami dostępności WCAG AA.

## 2. Lista widoków

### Ekran autoryzacji (`/auth`)
- **Główny cel**: Umożliwienie logowania i rejestracji użytkowników
- **Kluczowe informacje**: Formularz logowania/rejestracji, komunikaty błędów
- **Kluczowe komponenty**:
  - Formularz autoryzacji z polami email/hasło
  - Przełącznik między logowaniem a rejestracją
  - Przyciski akcji (Zaloguj się/Zarejestruj się)
  - Komunikaty błędów inline
- **UX/Dostępność/Bezpieczeństwo**: 
  - Walidacja formularzy po stronie klienta
  - Aria-labels dla czytników ekranu
  - Bezpieczne przekazywanie haseł
  - Loading states podczas autoryzacji

### Dashboard (`/`)
- **Główny cel**: Główny ekran po zalogowaniu, punkt wejścia do funkcji aplikacji
- **Kluczowe informacje**: Powitanie użytkownika, szybki dostęp do głównych funkcji, podstawowe statystyki
- **Kluczowe komponenty**:
  - Welcome banner z imieniem użytkownika
  - Karty nawigacyjne do głównych sekcji
  - Podgląd ostatnich fiszek
  - Podstawowe statystyki (liczba fiszek, postęp nauki)
- **UX/Dostępność/Bezpieczeństwo**:
  - Intuicyjna nawigacja do wszystkich sekcji
  - Keyboard navigation support
  - Automatyczne wylogowanie przy nieaktywności

### Widok generowania fiszek (`/generate`)
- **Główny cel**: Generowanie fiszek przez AI na podstawie dostarczonego tekstu
- **Kluczowe informacje**: Pole tekstowe, lista wygenerowanych propozycji, opcje recenzji
- **Kluczowe komponenty**:
  - Textarea z walidacją długości tekstu (1000-10000 znaków)
  - Przycisk "Generuj fiszki"
  - Lista propozycji fiszek z opcjami:
    - Przycisk akceptacji (✓)
    - Przycisk edycji (✏️)
    - Przycisk odrzucenia (✗)
  - Modal edycji fiszki
  - Przycisk "Zapisz wszystkie zatwierdzone"
  
- **UX/Dostępność/Bezpieczeństwo**:
  - Licznik znaków w czasie rzeczywistym
  - Bulk actions dla lepszej efektywności
  - Error handling dla błędów API
  - Focus management w modalach

### Widok listy fiszek (`/flashcards`)
- **Główny cel**: Przeglądanie, edycja i zarządzanie wszystkimi fiszkami użytkownika
- **Kluczowe informacje**: Lista wszystkich fiszek, opcje filtrowania i sortowania
- **Kluczowe komponenty**:
  - Przycisk "Dodaj nową fiszkę"
  - Lista/grid fiszek z podglądem przodu i tyłu
  - Opcje sortowania (data utworzenia, źródło, alfabetycznie)
  - Filtry (źródło: AI-full, AI-edited, manual)
  - Modal edycji fiszki
  - Przyciski akcji dla każdej fiszki (edytuj, usuń)
  - Paginacja
- **UX/Dostępność/Bezpieczeństwo**:
  - Confirm dialogs dla operacji usuwania
  - Keyboard shortcuts dla szybkiej nawigacji
  - Search functionality
  - Bulk selection dla operacji grupowych

### Widok sesji nauki (`/study`)
- **Główny cel**: Przeprowadzanie sesji nauki z wykorzystaniem algorytmu spaced repetition
- **Kluczowe informacje**: Aktualna fiszka, postęp sesji, opcje oceny
- **Kluczowe komponenty**:
  - Karta fiszki z przełączaniem przód/tył
  - Progress bar sesji
  - Przyciski oceny zgodne z algorytmem SM-2
  - Statystyki sesji (pozostałe fiszki, czas)
  - Przycisk "Zakończ sesję"
- **UX/Dostępność/Bezpieczeństwo**:
  - Keyboard shortcuts dla szybkiej oceny
  - Auto-save postępu
  - Gentle exit confirmations
  - Clear visual feedback dla interakcji

### Panel użytkownika (`/profile`)
- **Główny cel**: Zarządzanie kontem i ustawieniami.
- **Kluczowe informacje**: Dane profilowe, statystyki uczenia, ustawienia konta
- **Kluczowe komponenty**:
  - Sekcja informacji o koncie (email, data rejestracji)
  - Statystyki:
    - Liczba fiszek (total, AI-generated, manual)
    - Statystyki generowania (acceptance rate)
    - Historia nauki
- **UX/Dostępność/Bezpieczeństwo**:
  - Prosty i czytelny interfejs
  - Data export options (GDPR compliance)
  - Clear privacy information

## 3. Mapa podróży użytkownika

1. **Wejście na stronę** → Ekran autoryzacji
2. **Rejestracja** → Automatyczne logowanie
3. **Dashboard** → Pierwsza wizyta - przekierowanie do dashbordu - domyślnie do widoku generowania fiszek.
4. **Generowanie fiszek** → Wklejenie tekstu
5. **Recenzja propozycji** → Akceptacja/edycja/odrzucenie
6. **Zapis fiszek** → Przekierowanie do listy fiszek
7. **Sesja nauki** → Pierwsza sesja z nowymi fiszkami


## 4. Układ i struktura nawigacji

### Główna nawigacja (Topbar):
- **Logo/Nazwa aplikacji** (link do Dashboard)
- **Menu główne**:
  - Generuj fiszki (`/generate`)
  - Moje fiszki (`/flashcards`)
  - Sesja nauki (`/study`)
  - Profil (`/profile`)
- **User menu**:
  - Dropdown z opcjami: Profil, Wyloguj


## 5. Kluczowe komponenty

### Komponenty autoryzacji:
- **AuthForm**: Uniwersalny formularz logowania/rejestracji

### Komponenty fiszek:
- **FlashcardPreview**: Podgląd fiszki z przełączaniem stron
- **FlashcardEditor**: Modal/formularz edycji fiszki
- **FlashcardList**: Lista fiszek z opcjami sortowania/filtrowania

### Komponenty nauki:
- **StudySession**: Główny komponent sesji nauki
- **StudyCard**: Interaktywna karta do nauki
- **ProgressIndicator**: Wskaźnik postępu sesji

